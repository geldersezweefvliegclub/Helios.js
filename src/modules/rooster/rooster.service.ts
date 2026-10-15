import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperRooster} from "@prisma/client";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";
import {DdwvService} from "../ddwv/ddwv.service";

@Injectable()
export class RoosterService extends IHeliosService
{
   private readonly logger = new Logger(RoosterService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly ddwvService: DdwvService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operRooster.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Rooster record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`RoosterService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // Er mag maar een actief rooster per DATUM bestaan
   async GetObjectByDatum(datum: Date, uitgezonderdId?: number): Promise<OperRooster | null>
   {
      this.logger.verbose(`RoosterService.GetObjectByDatum(${safeStringify({datum, uitgezonderdId})})`);
      const result = await this.dbService.operRooster.findFirst({
         where: {
            DATUM: parseDateOnly(datum),
            VERWIJDERD: false,
            ID: uitgezonderdId ? { not: uitgezonderdId } : undefined
         }
      });
      this.logger.verbose(`RoosterService.GetObjectByDatum() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.logger.verbose(`RoosterService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {VERWIJDERD: false});
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperRoosterWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  {
                     DATUM:
                        {
                           gte: dtSpanne.start,
                           lte: dtSpanne.eind
                        }
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operRooster.count({where: where});
      }
      const objs = await this.dbService.operRooster.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperRoosterOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`RoosterService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperRoosterUncheckedCreateInput, actorId: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.AddObject(${safeStringify({data})})`);
      // DATUM altijd als UTC middernacht, ook bij interne aanroepen (bv. vindOfMaakRooster), zodat tijdzone of
      // tijdsdeel geen tweede record voor dezelfde datum kan opleveren
      const datum = parseDateOnly(data.DATUM as Date | string) as Date;
      const bestaand = await this.GetObjectByDatum(datum);
      if (bestaand)
         throw new HttpException("Datum bestaat al", HttpStatus.CONFLICT);

      // velden die niet zijn meegegeven worden afgeleid van de datum
      const insertData: Prisma.OperRoosterUncheckedCreateInput = {
         ...data,
         DATUM: datum,
         CLUB_BEDRIJF: data.CLUB_BEDRIJF ?? this.isClubBedrijf(datum),
         DDWV: data.DDWV ?? this.ddwvService.DagIsDDWV(datum),
         WINTER_WERK: data.WINTER_WERK ?? this.isWinterWerk(datum),
      };

      const obj = await this.dbService.operRooster.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj, actorId);
      this.logger.verbose(`RoosterService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperRoosterUncheckedUpdateInput, actorId: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      if (data.DATUM !== undefined)
         data = {...data, DATUM: parseDateOnly(data.DATUM as Date | string) as Date};

      // zelfde uniciteitsregel als bij AddObject: per DATUM mag maar 1 actief rooster bestaan - anders zou een
      // UpdateObject of RestoreObject (die via UpdateObject loopt) een dubbele datum kunnen maken. Een record dat
      // na de update verwijderd is (DeleteObject) telt niet mee.
      const nieuwVerwijderd = data.VERWIJDERD !== undefined ? data.VERWIJDERD as boolean : db.VERWIJDERD;
      if (!nieuwVerwijderd)
      {
         const nieuweDatum = data.DATUM !== undefined ? data.DATUM as Date : db.DATUM;
         const bestaand = await this.GetObjectByDatum(nieuweDatum, id);
         if (bestaand)
            throw new HttpException("Datum bestaat al", HttpStatus.CONFLICT);
      }

      const obj = await this.dbService.operRooster.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      this.logger.verbose(`RoosterService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`RoosterService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operRooster.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // clubbedrijf is er alleen op zaterdag en zondag tussen 1 maart en 1 november, zie AddObject() in class.Rooster.inc.php
   private isClubBedrijf(datum: Date): boolean
   {
      const weekdag = datum.getUTCDay();          // 0 = zondag, 6 = zaterdag
      return this.inClubSeizoen(datum) && (weekdag === 0 || weekdag === 6);
   }

   // winterwerk is er op zaterdag buiten het clubseizoen. De PHP conditie in AddObject() is nooit waar (datum < 301
   // EN >= 1101, en een string/int vergelijking op de weekdag), hier is de bedoelde logica geïmplementeerd
   private isWinterWerk(datum: Date): boolean
   {
      return !this.inClubSeizoen(datum) && datum.getUTCDay() === 6;
   }

   // valt de datum tussen 1 maart en 1 november. DATUM is een kalenderdatum (UTC middernacht), dus de UTC-velden gebruiken
   private inClubSeizoen(datum: Date): boolean
   {
      const dateValue = (datum.getUTCMonth() + 1) * 100 + datum.getUTCDate();
      return dateValue >= 301 && dateValue < 1101;
   }

   // normaliseert de datumvelden van de ruwe database-records naar de response-vorm
   private async MaakGetObjectsResponseDataset(objs: OperRooster[]): Promise<GetObjectsOperRoosterResponse[]>
   {
      this.logger.verbose(`RoosterService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map(obj => ({...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date}));
      this.logger.verbose(`RoosterService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }
}
