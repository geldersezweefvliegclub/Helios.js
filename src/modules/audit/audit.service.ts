import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Audit, Prisma } from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {GetObjectsAuditResponse} from "./GetObjectsAuditResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";

// audit record inclusief de relatie de RefLid (het lid dat de actie heeft uitgevoerd) - wordt gebruikt bij GetObjects
type AuditMetRelaties = Prisma.AuditGetPayload<{
   include: {
      RefLid: true,
   }
}>;

@Injectable()
export class AuditService extends IHeliosService
{
   private readonly logger = new Logger(AuditService.name);

   constructor(private readonly dbService: DbService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<Audit>
   {
      this.logger.verbose(`AuditService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.audit.findUnique({
         where: {
            ID: id
         }
      });

      if (!db)
         throw new HttpException(`Audit record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = {...db, DATUM: toDateOnly(db.DATUM) as unknown as Date};
      this.logger.verbose(`AuditService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsAuditRequest | undefined): Promise<IHeliosGetObjectsResponse<GetObjectsAuditResponse>>
   {
      this.logger.verbose(`AuditService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsAuditRequest, {VERWIJDERD: false, MAX: 1000});
      const sort = params.SORT ? params.SORT : "ID DESC";         // stel de sorteervolgorde in; standaard SORTEER_VOLGORDE indien niet opgegeven

      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.AuditWhereInput =
      {
         AND:
         [
            { ID: params.ID },
            { VERWIJDERD: params.VERWIJDERD ?? false },
            { ID: { in: params.IDs }},
            { LID_ID: params.LID_ID },
            { TABEL: params.TABEL },
            { ID: { gte: params.BEGIN_ID }},
            { ID: { lte: params.EIND_ID }},
            { OR: [
                  { RefLid: { NAAM: {contains: params.SELECTIE }}},
                  { TABEL: { contains: params.SELECTIE }},
                  { ACTIE: { contains: params.SELECTIE }},
                  { VOOR: { contains: params.SELECTIE }},
                  { DATA: { contains: params.SELECTIE }},
                  { RESULTAAT: { contains: params.SELECTIE }}
               ]
            },
            {
               DATUM:
                  {
                     gte: dtSpanne.start,
                     lte: dtSpanne.eind
                  }
            }
         ]
      }

      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.audit.count({where: where});
      }
      const objs = await this.dbService.audit.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.AuditOrderByWithRelationInput>(sort),
         take: params.MAX,
         skip: params.START,
         include: {
            RefLid: true
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`AuditService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }


   async AddObject(data: Prisma.AuditUncheckedCreateInput ): Promise<Audit>
   {
      this.logger.verbose(`AuditService.AddObject(${safeStringify({data})})`);
      const result = await this.dbService.audit.create({
         data: data
      });
      this.logger.verbose(`AuditService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.AuditUncheckedUpdateInput): Promise<Audit>
   {
      this.logger.verbose(`AuditService.UpdateObject(${safeStringify({id, data})})`);
      await this.GetObject(id);   // controleer of het record bestaat
      const result = await this.dbService.audit.update({
         where: {
            ID: id
         },
         data: data
      });
      this.logger.verbose(`AuditService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number): Promise<void>
   {
      this.logger.verbose(`AuditService.RemoveObject(${safeStringify({id})})`);
      await this.GetObject(id);   // controleer of het record bestaat
      await this.dbService.audit.delete({
         where: {
            ID: id
         }
      });
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: AuditMetRelaties[]): Promise<GetObjectsAuditResponse[]>
   {
      this.logger.verbose(`AuditService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {RefLid: lid, ...audit} = obj;

         return {
            ...audit,
            DATUM: toDateOnly(audit.DATUM) as unknown as Date,
            NAAM: lid?.NAAM ?? null,
         } as GetObjectsAuditResponse
      });
      this.logger.verbose(`AuditService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }
}
