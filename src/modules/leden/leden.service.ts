import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefLid } from '@prisma/client';
import {GetObjectsRefLedenRequest } from "./GetObjectsRefLedenRequest";
import {GetObjectsRefLedenResponse } from "./GetObjectsRefLedenResponse";
import {VerjaardagenResponse} from "./VerjaardagenResponse";

import { hash } from "bcryptjs";

@Injectable()
export class LedenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation:string = undefined): Promise<RefLid>
   {
      const db = await this.dbService.refLid.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefLidInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Lid record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
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
   async GetObjects(params?: GetObjectsRefLedenRequest | undefined): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>> {
      if (params === undefined)
      {
         params = new GetObjectsRefLedenRequest();
         params.VERWIJDERD = false;
         params.CLUBLEDEN = true;
      }
      const where: Prisma.RefLidWhereInput = {
         AND:
            [
               { ID: params.ID},
               { VERWIJDERD: params.VERWIJDERD ?? false},
               { ID: { in: params.IDs }},
               {
                  OR: [
                     { NAAM:        { contains: params.SELECTIE}},
                     { EMAIL:       { contains: params.SELECTIE}},
                     { TELEFOON:    { contains: params.SELECTIE}},
                     { MOBIEL:      { contains: params.SELECTIE}},
                     { NOODNUMMER:  { contains: params.SELECTIE}}
                  ]
               },
               { DDWV_CREW: params.DDWV_CREW},
               { BEHEERDER: params.BEHEERDERS},
               { INSTRUCTEUR: params.INSTRUCTEURS},
               { STARTLEIDER: params.STARTLEIDERS},
               { LIERIST: params.LIERISTEN},
               { LIERIST_IO: params.LIO},
               { BRANDSTOF_PAS: params.BRANDSTOF_PAS ? {not: null} : undefined},
               { LIDTYPE_ID: { in: params.TYPES}},
               { LIDTYPE_ID: params.CLUBLEDEN ? {in: [600, 601, 602, 603, 604, 605, 606]} : undefined}
            ]
      }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refLid.count({where: where});
      }
      const objs = await this.dbService.refLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefLidOrderByWithRelationInput>(params.SORT ?? "ACHTERNAAM"),
         take: params.MAX,
         skip: params.START,
         include: {
            LidType: true,
            VliegStatus: true,
            Zusterclub: true,
            Buddy: true,
            Buddy2: true
         }
      });
      // TODO progressiekaart voor pax bevoegdheid

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
      const db = await this.GetObject(id);

      // bouw de naam op uit voornaaam, tussenvoegsel en achternaam
      data.NAAM = data.VOORNAAM
      data.NAAM += (data.NAAM ? " " : "") + data.TUSSENVOEGSEL
      data.NAAM += (data.NAAM ? " " : "") + data.ACHTERNAAM

      if (data.WACHTWOORD)
         data.WACHTWOORD = await hash(data.WACHTWOORD as string, 10)

      const obj = await this.dbService.refLid.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.refLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }

   async GetVerjaardagen(aantal:number): Promise<VerjaardagenResponse[]>
   {
      const leden = await this.GetObjects()
      let l = leden.dataset.filter((f) => f.GEBOORTE_DATUM).map((lid) =>
      {
         const {NAAM, GEBOORTE_DATUM,} = lid;

         const vandaag = new Date()
         const dag: number = GEBOORTE_DATUM.getDate()
         const maand: number = GEBOORTE_DATUM.getMonth()
         let leeftijd = new Date().getFullYear() - GEBOORTE_DATUM.getFullYear();
         let dagenTeGaan: number = (new Date(vandaag.getFullYear(), maand, dag).getTime() - vandaag.getTime()) / (1000 * 60 * 60 * 24);

         // `dagenTeGaan` is negatief als de verjaardag al is geweest, dus voor volgend jaar berekenen
         if (dagenTeGaan < 0) {
            dagenTeGaan = (new Date(vandaag.getFullYear() + 1, maand, dag).getTime() - vandaag.getTime()) / (1000 * 60 * 60 * 24);
            leeftijd++
         }

         return {
            NAAM: NAAM,
            DAG: dag,
            MAAND: maand +1,
            LEEFTIJD: leeftijd,
            SORT: dagenTeGaan
         }
      })
      l = l.sort((a, b) => a.SORT - b.SORT).slice(0, aantal);
      l.forEach(item => { delete item.SORT });
      return l as VerjaardagenResponse[];
   }
}
