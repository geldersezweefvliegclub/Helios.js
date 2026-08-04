import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefTypesGroep} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "./GetObjectsRefTypesGroepenRequest";
import {GetObjectsRefTypesGroepenResponse} from "./GetObjectsRefTypesGroepenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";

export type OptionalKeysOf<Obj> = keyof {
   [Key
      in keyof Obj
      as Omit<Obj, Key> extends Obj ? Key : never
   ]: Obj[Key];
};


@Injectable()
export class TypesGroepenService extends IHeliosService
{
   private readonly logger = new Logger(TypesGroepenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<RefTypesGroep>
   {
      this.logger.verbose(`TypesGroepenService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.refTypesGroep.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefTypesGroepInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Typegroep record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`TypesGroepenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesGroepenResponse>>
   {
      this.logger.verbose(`TypesGroepenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsRefTypesGroepenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.RefTypesGroepWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }}
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refTypesGroep.count({where: where});
      }
      const objs = await this.dbService.refTypesGroep.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypesGroepOrderByWithRelationInput>(params.SORT ?? "SORTEER_VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START
      });
      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`TypesGroepenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefTypesGroepCreateInput): Promise<RefTypesGroep>
   {
      this.logger.verbose(`TypesGroepenService.AddObject(${safeStringify({data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      const obj = await this.dbService.refTypesGroep.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = obj;
      this.logger.verbose(`TypesGroepenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.RefTypesGroepUpdateInput): Promise<RefTypesGroep>
   {
      this.logger.verbose(`TypesGroepenService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      const db = await this.GetObject(id);
      const obj = await this.dbService.refTypesGroep.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = obj;
      this.logger.verbose(`TypesGroepenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`TypesGroepenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refTypesGroep.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }
}
