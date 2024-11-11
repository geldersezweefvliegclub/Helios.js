import { Injectable } from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Audit, Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {DatabaseEvents} from "../../core/helpers/Events";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GetObjectsRefLedenRequest} from "./LedenDTO";
import {hash} from "bcryptjs";

@Injectable()
export class LedenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation = undefined): Promise<RefLid>
   {
      return this.dbService.refLid.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefLidSelect>(relation),
      });
   }

   // retrieve a single object from the database based on the inlognaam
   async GetObjectByInlognaam(loginname: string): Promise<RefLid>
   {
      return this.dbService.refLid.findUnique({
         where: {
            INLOGNAAM: loginname.toLowerCase()
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<RefLid>>
   {
      const sort = params.SORT ? params.SORT : "ID";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.RefLidWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refLid.count({where: where});
      }
      const objs = await this.dbService.refLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefLidOrderByWithRelationInput>(sort),
         select: this.SelectStringToSelectObj<Prisma.RefLidSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs, count);
   }

   async AddObject(data: Prisma.RefLidCreateInput ): Promise<RefLid>
   {
      // bouw de naam op uit voornaaam, tussenvoegsel en achternaam
      data.NAAM = data.VOORNAAM
      data.NAAM += (data.NAAM ? " " : "") + data.TUSSENVOEGSEL
      data.NAAM += (data.NAAM ? " " : "") + data.ACHTERNAAM

      if (data.WACHTWOORD)
         data.WACHTWOORD = await hash(data.WACHTWOORD, 10)

      const obj = await this.dbService.refLid.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefLidUpdateInput): Promise<RefLid>
   {
      // bouw de naam op uit voornaaam, tussenvoegsel en achternaam
      data.NAAM = data.VOORNAAM
      data.NAAM += (data.NAAM ? " " : "") + data.TUSSENVOEGSEL
      data.NAAM += (data.NAAM ? " " : "") + data.ACHTERNAAM

      if (data.WACHTWOORD)
         data.WACHTWOORD = await hash(data.WACHTWOORD as string, 10)

      const db = this.GetObject(id);
      const obj = await this.dbService.refLid.update({
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
      const db = this.GetObject(id);
      await this.dbService.refLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }

   async GetVerjaardagen(): Promise<RefLid[]>
   {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      return this.dbService.refLid.findMany({
         where: {


         },
         orderBy: {

         },
         take: 7
      });
   }
}
