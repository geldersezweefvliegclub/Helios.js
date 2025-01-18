import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, HeliosDocument} from "@prisma/client";
import {GetObjectsHeliosDocumentenRequest} from "./GetObjectsHeliosDocumentenRequest";
import {GetObjectsHeliosDocumentenResponse} from "./GetObjectsHeliosDocumentenResponse";

@Injectable()
export class DocumentenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation: string = undefined): Promise<HeliosDocument>
   {
      const db = await this.dbService.heliosDocument.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.HeliosDocumentInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Document record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsHeliosDocumentenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsHeliosDocumentenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsHeliosDocumentenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.HeliosDocumentWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { GROEP_ID: params.GROEP_ID},
                  { LID_ID: params.LID_ID ?? null}
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
            RefLid: true,
            DocumentGroep: true
         }
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            NAAM: obj.RefLid?.NAAM ?? null,
            GROEP: obj.DocumentGroep?.OMSCHRIJVING ?? null
         } ;

         // delete child objects from the response
         delete retObj.RefLid;
         delete retObj.DocumentGroep;

         return  retObj as GetObjectsHeliosDocumentenResponse;
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.HeliosDocumentCreateInput): Promise<HeliosDocument>
   {
      const obj = await this.dbService.heliosDocument.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.HeliosDocumentUpdateInput): Promise<HeliosDocument>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.heliosDocument.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.heliosDocument.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
