import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class LedenService extends IHeliosService implements OnModuleInit
{

   constructor(private readonly logger: Logger,
               private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   onModuleInit() {
      // Module initialization logic if needed
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
   async GetObjects(params: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>> {
      const where: Prisma.RefLidWhereInput = {
         ID: params.ID,
         VERWIJDERD: params.VERWIJDERD ?? false,
         AND: params.IDs ? { ID: { in: params.IDs } } : undefined,
      };

      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined) {
         count = await this.dbService.refLid.count({ where });
      }

      const objs = await this.dbService.refLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefLidOrderByWithRelationInput>(params.SORT ?? "ID"),
         select: this.SelectStringToSelectObj<Prisma.RefLidSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      const response = objs.map((obj) => {
         return {
            ...obj,
            LIDTYPE: obj.LidType?.OMSCHRIJVING,
            LIDTYPE_REF: obj.LidType?.EXT_REF,
            STATUS: obj.VliegStatus?.OMSCHRIJVING,
            ZUSTERCLUB: obj.Zusterclub?.NAAM,
            BUDDY: obj.Buddy?.NAAM,
            BUDDY2: obj.Buddy2?.NAAM,
         } as GetObjectsRefLedenResponse;
      });

      return this.buildGetObjectsResponse(response, count);
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
