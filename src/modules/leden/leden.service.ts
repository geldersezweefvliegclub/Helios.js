import { Injectable, Logger } from '@nestjs/common';
import { DbService } from "../../database/db-service/db.service";
import { Prisma, RefLid } from '@prisma/client';
import { IHeliosGetObjectsResponse } from "../../core/DTO/IHeliosGetObjectsReponse";
import { IHeliosService } from "../../core/services/IHeliosService";
import { DatabaseEvents } from "../../core/helpers/Events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GetObjectsRefLedenRequest } from "./GetObjectsRefLedenRequest";
import { hash } from "bcryptjs";
import { GetObjectsRefLedenResponse } from "./GetObjectsRefLedenResponse";

@Injectable()
export class LedenService extends IHeliosService
{

   constructor(private readonly logger: Logger,
               private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation:string = undefined): Promise<RefLid>
   {
      return this.dbService.refLid.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefLidInclude>(relation)
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
   async GetObjects(params: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>> {
      const where: Prisma.RefLidWhereInput =
      {
         AND:
         [
            { ID: params.ID },
            { VERWIJDERD: params.VERWIJDERD ?? false },
            { ID: { in: params.IDs }},
            { OR: [
                  { NAAM: { contains: params.SELECTIE }},
                  { EMAIL: { contains: params.SELECTIE }},
                  { TELEFOON: { contains: params.SELECTIE }},
                  { MOBIEL: { contains: params.SELECTIE }},
                  { NOODNUMMER: { contains: params.SELECTIE }}
               ]
            },
            { DDWV_CREW: params.DDWV_CREW },
            { BEHEERDER: params.BEHEERDERS },
            { INSTRUCTEUR: params.INSTRUCTEURS },
            { STARTLEIDER: params.STARTLEIDERS },
            { LIERIST: params.LIERISTEN },
            { LIERIST_IO: params.LIO },
            { LIDTYPE_ID: { in: params.TYPES }},
            { LIDTYPE_ID: params.CLUBLEDEN ? { in: [600, 601, 602, 603, 604, 605, 606] } : undefined }
         ]
      };

      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined) {
         count = await this.dbService.refLid.count({ where });
      }

      const objs = await this.dbService.refLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefLidOrderByWithRelationInput>(params.SORT ?? "ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            LidType: true,
            VliegStatus: true,
            Zusterclub: true,
            Buddy: true,
            Buddy2: true,
         },
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            LIDTYPE: obj.LidType?.OMSCHRIJVING ?? null,
            LIDTYPE_REF: obj.LidType?.EXT_REF ?? null,
            STATUS: obj.VliegStatus?.OMSCHRIJVING ?? null,
            ZUSTERCLUB: obj.Zusterclub?.NAAM ?? null,
            BUDDY: obj.Buddy?.NAAM ?? null,
            BUDDY2: obj.Buddy2?.NAAM ?? null,
         } ;

         // delete child objects from the response
         delete retObj.LidType;
         delete retObj.VliegStatus;
         delete retObj.Zusterclub;
         delete retObj.Buddy;
         delete retObj.Buddy2;

         return  retObj as GetObjectsRefLedenResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
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

      const db = await this.GetObject(id);
      const obj = await this.dbService.refLid.update({
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
            GEBOORTE_DATUM: {
               gte: today,
               lte: nextWeek,
            },
         },
         orderBy: {
            GEBOORTE_DATUM: 'asc',
         },
      });
   }
}
