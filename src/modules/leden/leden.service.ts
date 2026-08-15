import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefLid} from '@prisma/client';
import {GetObjectsRefLedenRequest } from "./GetObjectsRefLedenRequest";
import {GetObjectsRefLedenResponse } from "./GetObjectsRefLedenResponse";
import {VerjaardagenResponse} from "./VerjaardagenResponse";
import {LidType} from "../../core/enums/LidType";
import {safeStringify} from "../../core/helpers/LogHelper";

const PAX_COMPETENTIE_ID = 271; // "PaxBevoegdheid" in PHP, configureerbaar maar in de praktijk altijd deze waarde

@Injectable()
export class LedenService extends IHeliosService
{
   private readonly logger = new Logger(LedenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation:string = undefined): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.refLid.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefLidInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Lid record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = db;
      this.logger.verbose(`LedenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal een enkel object op uit de database op basis van de inlognaam
   async GetObjectByInlognaam(loginname: string): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.GetObjectByInlognaam(${safeStringify({loginname})})`);
      const result = await this.dbService.refLid.findMany({
         where: {
            INLOGNAAM: loginname,
            VERWIJDERD: false,
         }
      });

      if (!result) {
         this.logger.warn(`LedenService.GetObjectByInlognaam() => Lid record met INLOGNAAM ${loginname} niet gevonden`);
         throw new HttpException(`Lid met INLOGNAAM ${loginname} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      if (result.length > 1) {
         this.logger.error(`LedenService.GetObjectByInlognaam() => Meerdere leden gevonden met INLOGNAAM ${loginname}`);
         throw new HttpException(`Meerdere lid records gevonden met INLOGNAAM ${loginname}`, HttpStatus.CONFLICT);
      }

      this.logger.verbose(`LedenService.GetObjectByInlognaam() => ${safeStringify(result[0])}`);
      return result[0];
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefLedenRequest | undefined): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>> {
      this.logger.verbose(`LedenService.GetObjects(${safeStringify({params})})`);
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
               { LIDTYPE_ID: params.CLUBLEDEN ? {in: [
                  LidType.Student, LidType.Erelid, LidType.Lid, LidType.Jeugdlid,
                  LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur, LidType.Rittenkaart
               ]} : undefined}
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
      // progressiekaart voor pax bevoegdheid: heeft het lid een progressie record voor de pax competentie?
      const paxProgressies = await this.dbService.operProgressie.findMany({
         where: {
            COMPETENTIE_ID: PAX_COMPETENTIE_ID,
            LID_ID: {in: objs.map(obj => obj.ID)}
         },
         select: {LID_ID: true}
      });
      const ledenMetPax = new Set(paxProgressies.map(p => p.LID_ID));

      const response = objs.map((obj) => {
         // kopieer relevante velden van child objects naar het parent object
         const retObj = {
            ...obj,
            LIDTYPE: obj.LidType?.OMSCHRIJVING ?? null,
            LIDTYPE_REF: obj.LidType?.EXT_REF ?? null,
            STATUS: obj.VliegStatus?.OMSCHRIJVING ?? null,
            ZUSTERCLUB: obj.Zusterclub?.NAAM ?? null,
            BUDDY: obj.Buddy?.NAAM ?? null,
            BUDDY2: obj.Buddy2?.NAAM ?? null,
            PAX: ledenMetPax.has(obj.ID),
         } ;

         // verwijder child objects uit de response
         delete retObj.LidType;
         delete retObj.VliegStatus;
         delete retObj.Zusterclub;
         delete retObj.Buddy;
         delete retObj.Buddy2;

         return  retObj as GetObjectsRefLedenResponse
      });
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`LedenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefLidUncheckedCreateInput, actorId: number): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.refLid.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`LedenService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefLidUncheckedUpdateInput, actorId: number): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      const obj = await this.dbService.refLid.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      this.logger.verbose(`LedenService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`LedenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }

   async GetVerjaardagen(aantal:number): Promise<VerjaardagenResponse[]>
   {
      this.logger.verbose(`LedenService.GetVerjaardagen(${safeStringify({aantal})})`);
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
      const result = l as VerjaardagenResponse[];
      this.logger.verbose(`LedenService.GetVerjaardagen() => ${safeStringify(result)}`);
      return result;
   }
}
