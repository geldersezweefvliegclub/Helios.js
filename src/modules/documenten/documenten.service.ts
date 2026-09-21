import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {Prisma, HeliosDocument} from "@prisma/client";
import {GetObjectsHeliosDocumentenRequest} from "./GetObjectsHeliosDocumentenRequest";
import {GetObjectsHeliosDocumentenResponse} from "./GetObjectsHeliosDocumentenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {hash as bcryptHash} from "bcryptjs";
import {promises as fs} from "fs";
import {basename, join} from "path";

// document record inclusief de relatie die de PHP documenten_view samenvoegt
type DocumentMetRelaties = Prisma.HeliosDocumentGetPayload<{
   include: {
      DocumentGroep: true,
   }
}>;

// input voor het opslaan van een geuploade bestandsbijlage, zie class.Documenten.inc.php AddObject()/UpdateObject()
export interface DocumentUpload {
   DOC_NAAM: string;
   BASE64_DOC: string;
   OVERSCHRIJVEN?: boolean;
   baseUrl: string;
}

@Injectable()
export class DocumentenService extends IHeliosService
{
   private readonly logger = new Logger(DocumentenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly configService: ConfigService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<HeliosDocument>
   {
      this.logger.verbose(`DocumentenService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.heliosDocument.findUnique({
         where: {
            ID: id
         }
      });
      if (!db)
         throw new HttpException(`Document record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`DocumentenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsHeliosDocumentenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsHeliosDocumentenResponse>>
   {
      this.logger.verbose(`DocumentenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsHeliosDocumentenRequest, {VERWIJDERD: false});
      const where: Prisma.HeliosDocumentWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { GROEP_ID: { in: params.GROEPEN }},
                  { LID_ID: params.LID_ID ? { in: params.LID_ID } : null}
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.heliosDocument.count({where: where});
      }
      const objs = await this.dbService.heliosDocument.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.HeliosDocumentOrderByWithRelationInput>(params.SORT ?? "DocumentGroep.SORTEER_VOLGORDE, VOLGORDE"),
         take: params.MAX,
         skip: params.START,
         include: {
            DocumentGroep: true
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`DocumentenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.HeliosDocumentUncheckedCreateInput, actorId: number, upload?: DocumentUpload): Promise<HeliosDocument>
   {
      this.logger.verbose(`DocumentenService.AddObject(${safeStringify({data, upload})})`);
      // TEKST is enkel verplicht als het geen lege regel is - zie AddObject() in class.Documenten.inc.php
      if (!data.LEGE_REGEL && data.TEKST === undefined)
         throw new HttpException(`TEKST is verplicht`, HttpStatus.BAD_REQUEST);

      // een lege regel heeft nooit inhoud, ongeacht wat er verder is meegegeven
      if (data.LEGE_REGEL)
      {
         data.TEKST = null;
         data.URL = null;
      }

      if (upload)
         data.URL = await this.opslaanDocument(data.LID_ID as number | null | undefined, upload);

      const obj = await this.dbService.heliosDocument.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`DocumentenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.HeliosDocumentUncheckedUpdateInput, actorId: number, upload?: DocumentUpload): Promise<HeliosDocument>
   {
      this.logger.verbose(`DocumentenService.UpdateObject(${safeStringify({id, data, upload})})`);
      const db = await this.GetObject(id);

      // een lege regel heeft nooit inhoud, ongeacht wat er verder is meegegeven
      if (data.LEGE_REGEL)
      {
         data.TEKST = null;
         data.URL = null;
      }

      if (upload)
         data.URL = await this.opslaanDocument(data.LID_ID as number | null | undefined, upload);

      const obj = await this.dbService.heliosDocument.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`DocumentenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`DocumentenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.heliosDocument.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: DocumentMetRelaties[]): Promise<GetObjectsHeliosDocumentenResponse[]>
   {
      this.logger.verbose(`DocumentenService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {DocumentGroep: documentGroep, ...document} = obj;

         return {
            ...document,
            GROEP: documentGroep?.OMSCHRIJVING ?? null
         } as GetObjectsHeliosDocumentenResponse;
      });
      this.logger.verbose(`DocumentenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // slaat een geuploade bestandsbijlage op onder app_settings.DocDir en geeft de publieke URL terug.
   // bij een LID_ID wordt het bestand in een per-upload verduisterde submap gezet (bcrypt hash van het
   // LID_ID, filesystem/URL-veilig gemaakt)
   private async opslaanDocument(lidId: number | null | undefined, upload: DocumentUpload): Promise<string>
   {
      this.logger.verbose(`DocumentenService.opslaanDocument(${safeStringify({lidId, DOC_NAAM: upload.DOC_NAAM})})`);
      const docDir = this.configService.get<string>('app_settings.DocDir') ?? '/var/www/html/documenten';
      const docNaam = basename(upload.DOC_NAAM);

      let subdir: string | undefined;
      let directory = docDir;
      let bestandsnaam = docNaam;
      if (lidId != null)
      {
         const ruweHash = await bcryptHash(String(lidId), 12);
         subdir = Buffer.from(ruweHash).toString('base64url');
         directory = join(docDir, subdir);
         bestandsnaam = `${lidId}_${docNaam}`;
      }

      await fs.mkdir(directory, {recursive: true});
      const volledigPad = join(directory, bestandsnaam);

      if (upload.OVERSCHRIJVEN === false)
      {
         const bestaatAl = await fs.access(volledigPad).then(() => true).catch(() => false);
         if (bestaatAl)
            throw new HttpException(`Bestand bestaat al (${docNaam})`, HttpStatus.CONFLICT);
      }

      try
      {
         await fs.writeFile(volledigPad, Buffer.from(upload.BASE64_DOC, 'base64'));
      }
      catch
      {
         throw new HttpException(`Bestand kan niet worden opgeslagen (${docNaam})`, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const urlPad = subdir ? `${subdir}/${bestandsnaam}` : bestandsnaam;
      const result = `${upload.baseUrl}/documenten/${urlPad}`;
      this.logger.verbose(`DocumentenService.opslaanDocument() => ${safeStringify(result)}`);
      return result;
   }
}
