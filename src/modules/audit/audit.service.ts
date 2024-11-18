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
   async GetObjects(params: GetObjectsAuditRequest): Promise<IHeliosGetObjectsResponse<GetObjectsAuditResponse>>
   {
      const sort = params.SORT ? params.SORT : "ID DESC";         // set the sort order if not defined default to SORTEER_VOLGORDE

      const startTime = params.DATUM ? new Date(new Date(params.DATUM).setHours(0, 0, 0, 0)) : undefined;
      const endTime = params.DATUM ? new Date(new Date(params.DATUM).setHours(23, 59, 59, 999)) : undefined;

      const startDate = params.BEGIN_DATUM ? new Date(new Date(params.BEGIN_DATUM).setHours(0, 0, 0, 0)) : undefined;
      const endDate = params.EIND_DATUM ? new Date(new Date(params.EIND_DATUM).setHours(23, 59, 59, 999)) : undefined;

      const where: Prisma.AuditWhereInput =
      {
         AND:
         [
            { ID: params.ID },
            { VERWIJDERD: params.VERWIJDERD ?? false },
            { ID: { in: params.IDs }},
            { LID_ID: params.LID_ID },
            {
               OR: [
                  {
                     DATUM:
                        {
                           gte: startTime,
                           lte: endTime
                        }
                  },
                  {
                     DATUM:
                        {
                           gte: startDate,
                           lte: endDate
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
      const obj = await this.dbService.audit.update({
         where: {
            ID: id
         },
         data: data
      });
      return obj;
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
