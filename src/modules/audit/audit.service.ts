import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Audit, Prisma } from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {GetObjectsAuditResponse} from "./GetObjectsAuditResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {toDateOnly} from "../../core/helpers/TimeDate";

// audit record inclusief de relatie die de PHP audit_view samenvoegt
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
   async GetObject(id: number, relation: string = undefined): Promise<Audit>
   {
      this.logger.verbose(`AuditService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.audit.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.AuditInclude>(relation)
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
      {
         params = new GetObjectsAuditRequest();
         params.VERWIJDERD = false;
         params.MAX = 1000;
      }
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
               OR: [
                  {
                     DATUM:
                        {
                           gte: dtSpanne.start,
                           lte: dtSpanne.eind
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

      const response = await this.NaarGetObjectsResponse(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`AuditService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // voegt de velden toe die de PHP audit_view samenvoegt
   private async NaarGetObjectsResponse(objs: AuditMetRelaties[]): Promise<GetObjectsAuditResponse[]>
   {
      this.logger.verbose(`AuditService.NaarGetObjectsResponse(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         // kopieer relevante velden van child objects naar het parent object
         const retObj = {
            ...obj,
            DATUM: toDateOnly(obj.DATUM) as unknown as Date,
            NAAM: obj.RefLid?.NAAM ?? null,
         } ;

         // verwijder child objects uit de response
         delete retObj.RefLid;

         return  retObj as GetObjectsAuditResponse
      });
      this.logger.verbose(`AuditService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
      return result;
   }


   async AddObject(data: Prisma.AuditCreateInput ): Promise<Audit>
   {
      this.logger.verbose(`AuditService.AddObject(${safeStringify({data})})`);
      const result = await this.dbService.audit.create({
         data: data
      });
      this.logger.verbose(`AuditService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.AuditUpdateInput): Promise<Audit>
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
}
