import {Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Audit, Prisma } from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {GetObjectsAuditResponse} from "./GetObjectsAuditReponse";

@Injectable()
export class AuditService extends IHeliosService
{
   constructor(private readonly dbService: DbService)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation: string = undefined): Promise<Audit>
   {
      return this.dbService.audit.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.AuditInclude>(relation)
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsAuditRequest | undefined): Promise<IHeliosGetObjectsResponse<GetObjectsAuditResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsAuditRequest();
         params.VERWIJDERD = false;
         params.MAX = 1000;
      }
      const sort = params.SORT ? params.SORT : "ID DESC";         // set the sort order if not defined default to SORTEER_VOLGORDE

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
               OR: [
                  {
                     DATUM:
                        {
                           gte: dtSpanne.startTime,
                           lte: dtSpanne.endTime
                        }
                  },
                  {
                     DATUM:
                        {
                           gte: dtSpanne.startDate,
                           lte: dtSpanne.endDate
                        }
                  }
               ]
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

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            NAAM: obj.RefLid?.NAAM ?? null,
         } ;

         // delete child objects from the response
         delete retObj.RefLid;

         return  retObj as GetObjectsAuditResponse
      });

      return this.buildGetObjectsResponse(response, count, params.HASH);
   }


   async AddObject(data: Prisma.AuditCreateInput ): Promise<Audit>
   {
      return await this.dbService.audit.create({
         data: data
      });
   }

   async UpdateObject(id: number, data: Prisma.AuditUpdateInput): Promise<Audit>
   {
      return await this.dbService.audit.update({
         where: {
            ID: id
         },
         data: data
      });
   }

   async RemoveObject(id: number): Promise<void>
   {
      await this.dbService.audit.delete({
         where: {
            ID: id
         }
      });
   }
}
