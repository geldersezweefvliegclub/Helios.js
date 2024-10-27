import {Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Audit, Prisma} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {GetObjectsAuditRequest} from "./AuditDTO";

@Injectable()
export class AuditService extends IHeliosService
{
   constructor(private readonly dbService: DbService)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number): Promise<Audit>
   {
      return this.dbService.audit.findUnique({
         where: {
            ID: id
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsAuditRequest): Promise<IHeliosGetObjectsResponse<Audit>>
   {
      const sort = params.SORT ? params.SORT : "ID DESC";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.AuditWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      const objs = await this.dbService.audit.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.AuditOrderByWithRelationInput>(sort),
         select: this.SelectStringToSelectObj<Prisma.AuditSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs);
   }


   async AddObject(data: Prisma.AuditCreateInput ): Promise<Audit>
   {
      const obj = await this.dbService.audit.create({
         data: data
      });
      return obj;
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
