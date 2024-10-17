import {Injectable} from '@nestjs/common';
import {DbService} from "../../../database/db-service/db.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../../core/services/IHeliosService";
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";

@Injectable()
export class TypesGroepenService extends IHeliosService
{
   constructor(private readonly dbService: DbService)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number): Promise<RefTypesGroepen>
   {
      return this.dbService.refTypesGroepen.findUnique({
         where: {
            ID: id
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepen>>
   {
      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.RefTypesGroepenWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      const objs = await this.dbService.refTypesGroepen.findMany({
         where: where,
         orderBy: this.Sort<Prisma.RefTypesGroepenOrderByWithRelationInput>(sort),
         select: this.Select<Prisma.RefTypesGroepenSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs);
   }

   async AddObject(data: Prisma.RefTypesGroepenCreateInput): Promise<RefTypesGroepen>
   {
      return this.dbService.refTypesGroepen.create({
         data: data
      });
   }

   async UpdateObject(id: number, data: Prisma.RefTypesGroepenUpdateInput): Promise<RefTypesGroepen>
   {
      return this.dbService.refTypesGroepen.update({
         where: {
            ID: id
         },
         data: data
      });
   }

   async RemoveObject(id: number): Promise<void>
   {
      await this.dbService.refTypesGroepen.delete({
         where: {
            ID: id
         }
      });
   }
}
