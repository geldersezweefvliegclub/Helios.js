import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from "@prisma/client";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {GetOperDienstenResponse} from "./GetOperDienstenResponse";
import {TotaalDienstenResponse} from "./TotaalDienstenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";
import {RoosterService} from "../rooster/rooster.service";
import {GetObjectsOperRoosterRequest} from "../rooster/GetObjectsOperRoosterRequest";

// dienst record inclusief de relaties die nodig zijn voor de GetObjects response,
// zodat we de naam van het lid en de omschrijving van het type dienst kunnen ophalen
type DienstMetRelaties = Prisma.OperDienstGetPayload<{
   include: {
      TypeDienst: true,
      RefLid: true,
      RefIngevoerd: true,
   }
}>;

@Injectable()
export class DienstenService extends IHeliosService
{
   private readonly logger = new Logger(DienstenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly roosterService: RoosterService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operDienst.findUnique({
         where: {
            ID: id
         },
      });

      if (!db) {
         throw new HttpException(`DagRapport record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      const result = new GetOperDienstenResponse(db);
      this.logger.verbose(`DienstenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   // toegestaneDatums: optionele lijst van DATUMs om het resultaat tot te beperken (mechanisch toegepast -
   // de PermissieService-afweging welke datums dat zijn gebeurt in de controller, zie DienstenController)
   async GetObjects(params?: GetObjectsOperDienstenRequest, toegestaneDatums?: Date[]): Promise<IHeliosGetObjectsResponse<GetOperDienstenResponse>>
   {
      this.logger.verbose(`DienstenService.GetObjects(${safeStringify({params, toegestaneDatums})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperDienstenRequest, {VERWIJDERD: false});

      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperDienstWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: params.LID_ID },
                  { AANWEZIG: params.AANWEZIG },
                  { AFWEZIG: params.AFWEZIG },
                  { DATUM: toegestaneDatums ? { in: toegestaneDatums } : undefined },
                  {
                     DATUM:
                        {
                           gte: dtSpanne.start,
                           lte: dtSpanne.eind
                        }
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operDienst.count({where: where});
      }
      const objs = await this.dbService.operDienst.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperDienstOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            TypeDienst: true,
            RefLid: true,
            RefIngevoerd: true
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`DienstenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperDienstUncheckedCreateInput, actorId: number): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.AddObject(${safeStringify({data})})`);
      if (data.DATUM != null) {
         data.ROOSTER_ID = await this.vindOfMaakRooster(data.DATUM as Date, actorId);
      }
      if (data.TYPE_DIENST_ID != null && data.DATUM != null) {
         await this.uniekeDienst(data.DATUM as Date, data.TYPE_DIENST_ID as number);
      }
      const obj = await this.dbService.operDienst.create({
         data: data,
         include: {
            TypeDienst: true
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = new GetOperDienstenResponse(obj);
      this.logger.verbose(`DienstenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperDienstUncheckedUpdateInput, actorId: number): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      const nieuweDatum = data.DATUM != null ? data.DATUM as Date : new Date(db.DATUM);
      const nieuweTypeDienstId = data.TYPE_DIENST_ID !== undefined ? data.TYPE_DIENST_ID as number | null : db.TYPE_DIENST_ID;

      data.ROOSTER_ID = await this.vindOfMaakRooster(nieuweDatum, actorId);

      if (nieuweTypeDienstId != null) {
         await this.uniekeDienst(nieuweDatum, nieuweTypeDienstId, id);
      }

      const obj = await this.dbService.operDienst.update({
         where: {
            ID: id
         },
         data: data,
         include: {
            TypeDienst: true
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);

      const result = new GetOperDienstenResponse(obj);
      this.logger.verbose(`DienstenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`DienstenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operDienst.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // Aantal diensten per lid per maand in een bepaald jaar, enkel voor club-bedrijf dagen (DDWV-dagen tellen niet mee).
   // Per lid volgt na de maandregels een jaartotaal-rij (MAAND: null).
   async TotaalDiensten(jaar: number, lidId?: number): Promise<TotaalDienstenResponse[]>
   {
      this.logger.verbose(`DienstenService.TotaalDiensten(${safeStringify({jaar, lidId})})`);

      const beginJaar = new Date(Date.UTC(jaar, 0, 1));
      const eindJaar = new Date(Date.UTC(jaar, 11, 31, 23, 59, 59, 999));

      const diensten = await this.dbService.operDienst.findMany({
         where: {
            VERWIJDERD: false,
            LID_ID: lidId,
            Rooster: {
               CLUB_BEDRIJF: true,
               DATUM: { gte: beginJaar, lte: eindJaar }
            }
         },
         include: {
            Rooster: true,
            RefLid: true
         }
      });

      // groepeer per lid + maand
      const perMaand = new Map<string, TotaalDienstenResponse>();
      for (const dienst of diensten) {
         const maand = dienst.Rooster.DATUM.getUTCMonth() + 1;
         const sleutel = `${dienst.LID_ID}-${maand}`;
         const bestaand = perMaand.get(sleutel);
         if (bestaand) {
            bestaand.AANTAL++;
         } else {
            perMaand.set(sleutel, {
               LID_ID: dienst.LID_ID,
               NAAM: dienst.RefLid.NAAM,
               JAAR: jaar,
               MAAND: maand,
               AANTAL: 1
            });
         }
      }

      const maandRecords = Array.from(perMaand.values())
         .sort((a, b) => (a.NAAM ?? "").localeCompare(b.NAAM ?? "") || a.MAAND - b.MAAND);

      // control-break: na de maandregels van elk lid volgt een jaartotaal-rij (MAAND: null)
      const resultaat: TotaalDienstenResponse[] = [];
      let huidigLidId: number | null = null;
      let huidigNaam: string | null = null;
      let totaal = 0;

      for (const record of maandRecords) {
         if (huidigLidId != null && huidigLidId !== record.LID_ID) {
            resultaat.push({ LID_ID: huidigLidId, NAAM: huidigNaam, JAAR: jaar, MAAND: null, AANTAL: totaal });
            totaal = 0;
         }
         resultaat.push(record);
         huidigNaam = record.NAAM;
         huidigLidId = record.LID_ID;
         totaal += record.AANTAL;
      }

      // laatste (of enige) lid moet ook zijn jaartotaal-rij krijgen
      resultaat.push({ LID_ID: huidigLidId, NAAM: huidigNaam, JAAR: jaar, MAAND: null, AANTAL: totaal });

      this.logger.verbose(`DienstenService.TotaalDiensten() => ${safeStringify(resultaat)}`);
      return resultaat;
   }

   // Heeft dit lid op deze datum een (niet verwijderde) dienst? Gebruikt voor de toegang van DDWV crew, zie
   // heeftToegangDDWVCrew() in include/helios.php
   async LidHeeftDienst(lidId: number, datum: Date): Promise<boolean>
   {
      this.logger.verbose(`DienstenService.LidHeeftDienst(${safeStringify({lidId, datum})})`);
      const aantal = await this.dbService.operDienst.count({
         where: {LID_ID: lidId, DATUM: datum, VERWIJDERD: false}
      });
      const result = aantal > 0;
      this.logger.verbose(`DienstenService.LidHeeftDienst() => ${safeStringify(result)}`);
      return result;
   }

   // datums waarop dit lid een (niet verwijderde) dienst heeft. Gebruikt voor de vliegdagen die DDWV crew mag zien,
   // zie GetVliegDagen() in class.Startlijst.inc.php
   async LidDienstDatums(lidId: number): Promise<Date[]>
   {
      this.logger.verbose(`DienstenService.LidDienstDatums(${safeStringify({lidId})})`);
      const diensten = await this.dbService.operDienst.findMany({
         where: {LID_ID: lidId, VERWIJDERD: false},
         select: {DATUM: true},
      });
      const result = diensten.map(dienst => dienst.DATUM);
      this.logger.verbose(`DienstenService.LidDienstDatums() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: DienstMetRelaties[]): Promise<GetOperDienstenResponse[]>
   {
      this.logger.verbose(`DienstenService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((o) => new GetOperDienstenResponse(o));
      this.logger.verbose(`DienstenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // zoek het rooster-record voor deze DATUM op,en maak er automatisch één aan als het nog niet bestaat.
   // De client hoeft daarom nooit zelf een ROOSTER_ID op te geven of te kennen.
   private async vindOfMaakRooster(datum: Date, actorId: number): Promise<number>
   {
      const roosterResult = await this.roosterService.GetObjects(
         MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {DATUM: datum})
      );

      if (roosterResult.dataset.length > 0) {
         return roosterResult.dataset[0].ID;
      }

      const nieuwRooster = await this.roosterService.AddObject(
         {DATUM: datum} as Prisma.OperRoosterUncheckedCreateInput, actorId
      );
      return nieuwRooster.ID;
   }

   // Een TYPE_DIENST_ID mag maar één keer per DATUM voorkomen onder de actieve (niet-verwijderde) diensten
   private async uniekeDienst(datum: Date, typeDienstId: number, uitgezonderdId?: number): Promise<void>
   {
      const bestaand = await this.dbService.operDienst.findFirst({
         where: {
            DATUM: datum,
            TYPE_DIENST_ID: typeDienstId,
            VERWIJDERD: false,
            ID: uitgezonderdId ? { not: uitgezonderdId } : undefined
         }
      });

      if (bestaand) {
         throw new HttpException(`Dienst ${typeDienstId} op ${toDateOnly(datum)} bestaat al`, HttpStatus.CONFLICT);
      }
   }
}
