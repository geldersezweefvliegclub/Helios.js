import {Injectable, Logger} from '@nestjs/common';
import {IHeliosService} from "../../core/services/IHeliosService";
import {DbService} from "../../database/db-service/db.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {Prisma, RefVliegtuig} from "@prisma/client";
import {DatabaseEvents} from "../../core/helpers/Events";
import {GetObjectsRefVliegtuigenRequest} from "../vliegtuigen/GetObjectsRefVliegtuigenRequest";
import {GetObjectsRefVliegtuigenResponse} from "../vliegtuigen/GetObjectsRefVliegtuigenResponse";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";

@Injectable()
export class VliegtuigenService extends IHeliosService
{
   constructor(private readonly logger: Logger,
               private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation:string = undefined): Promise<RefVliegtuig>
   {
      return this.dbService.refVliegtuig.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefVliegtuigInclude>(relation)
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefVliegtuigenResponse>> {
      const where: Prisma.RefVliegtuigWhereInput =
         {
            AND:
               [
                  { ID: params.ID },
                  { VERWIJDERD: params.VERWIJDERD ?? false },
                  { ID: { in: params.IDs }},
                  { OR: [
                        { REGISTRATIE: { contains: params.SELECTIE }},
                        { CALLSIGN: { contains: params.SELECTIE }},
                        { FLARMCODE: { contains: params.SELECTIE }}
                     ]
                  },
                  { ZITPLAATSEN: params.ZITPLAATSEN},
                  { CLUBKIST: params.CLUBKIST},
                  { SLEEPKIST: params.SLEEPKIST},
                  { ZELFSTART: params.ZELFSTART },
                  { TMG: params.TMG },
                  { TYPE_ID: { in: params.TYPES }},
               ]
         };

      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined) {
         count = await this.dbService.refVliegtuig.count({ where });
      }

      //TODO: journaal_aantal, bevoegdheid_lokaal, bevoegdheid_overland
      const objs = await this.dbService.refVliegtuig.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefVliegtuigOrderByWithRelationInput>(params.SORT ?? "VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            VliegtuigType: true,
         },
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            VLIEGTUIGTYPE: obj.VliegtuigType?.OMSCHRIJVING ?? null,
            REG_CALL: obj.REGISTRATIE + (obj.CALLSIGN ?  " (" + obj.CALLSIGN + ")" : "")
         } ;

         // delete child objects from the response
         delete retObj.VliegtuigType;

         return  retObj as GetObjectsRefVliegtuigenResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.RefVliegtuigCreateInput ): Promise<RefVliegtuig>
   {
      const obj = await this.dbService.refVliegtuig.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefVliegtuigUpdateInput): Promise<RefVliegtuig>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.refVliegtuig.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void> {
      const db = await this.GetObject(id);
      await this.dbService.refVliegtuig.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}