import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperBrandstof} from '@prisma/client';
import {GetObjectsOperBrandstofRequest} from "./GetObjectsOperBrandstofRequest";
import {GetObjectsOperBrandstofResponse} from "./GetObjectsOperBrandstofResponse";
import {CreateOperBrandstofDto} from "../../generated/nestjs-dto/create-operBrandstof.dto";
import {UpdateOperBrandstofDto} from "../../generated/nestjs-dto/update-operBrandstof.dto";
import {LedenService} from "../leden/leden.service";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class BrandstofService extends IHeliosService
{
   private readonly logger = new Logger(BrandstofService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly ledenService: LedenService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation :string = undefined): Promise<OperBrandstof>
   {
      this.logger.verbose(`BrandstofService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.operBrandstof.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.OperBrandstofInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Brandstof record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`BrandstofService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperBrandstofRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperBrandstofResponse>>
   {
      this.logger.verbose(`BrandstofService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperBrandstofRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperBrandstofWhereInput =
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
         count = await this.dbService.operBrandstof.count({where: where});
      }
      const objs = await this.dbService.operBrandstof.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperBrandstofOrderByWithRelationInput>(params.SORT ?? "TIJDSTIP DESC"),
         take: params.MAX,
         skip: params.START,
         include: {
            BrandstofType: true
         }
      });

      const response = objs.map((obj) => {
         // kopieer relevante velden van child objects naar het parent object
         const retObj = {
            ...obj,
            TIJDSTIP: toDateOnly(obj.TIJDSTIP) as unknown as Date,
            BRANDSTOF_TYPE: obj.BrandstofType?.OMSCHRIJVING ?? null,
         } ;

         // verwijder child objects uit de response
         delete retObj.BrandstofType;

         return  retObj as GetObjectsOperBrandstofResponse
      });
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`BrandstofService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: CreateOperBrandstofDto): Promise<OperBrandstof>
   {
      this.logger.verbose(`BrandstofService.AddObject(${safeStringify({data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      const lid = await this.ledenService.GetObject(data.LID_ID);
      if (!lid)
         throw new HttpException(`Lid with ID ${data.LID_ID} not found`, HttpStatus.NOT_FOUND);

      // verwijder BRANDSTOF_TYPE_ID en LID_ID uit de data
      // en voeg ze toe aan de BrandstofType, RefLid property
      const {BRANDSTOF_TYPE_ID, LID_ID, ...rest} = data;
      const connect = (id?: number) => id ? {connect: {ID: id}} : undefined;
      const insertData: Prisma.OperBrandstofCreateInput = {
         ...rest,
         BrandstofType: connect(BRANDSTOF_TYPE_ID),
         RefLid: connect(LID_ID),
         NAAM: lid.NAAM,
      };
      insertData.TIJDSTIP = parseDateOnly(insertData.TIJDSTIP as Date | string);

      const obj = await this.dbService.operBrandstof.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj);
      const result = {...obj, TIJDSTIP: toDateOnly(obj.TIJDSTIP) as unknown as Date};
      this.logger.verbose(`BrandstofService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: UpdateOperBrandstofDto | Prisma.OperBrandstofUpdateInput): Promise<OperBrandstof>
   {
      this.logger.verbose(`BrandstofService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      const db = await this.GetObject(id);

      let updateData: Prisma.OperBrandstofUpdateInput = data as Prisma.OperBrandstofUpdateInput;
      if ('LID_ID' in data)
      {
         const lid = await this.ledenService.GetObject(data.LID_ID);
         if (!lid)
            throw new HttpException(`Lid with ID ${data.LID_ID} not found`, HttpStatus.NOT_FOUND);

         // verwijder BRANDSTOF_TYPE_ID en LID_ID uit de data
         // en voeg ze toe aan de BrandstofType, RefLid property
         const {BRANDSTOF_TYPE_ID, LID_ID, ...rest} = data;
         updateData = {
            ...rest,
            BrandstofType: (BRANDSTOF_TYPE_ID !== undefined) ? {connect: {ID: BRANDSTOF_TYPE_ID}} : undefined,
            RefLid: LID_ID ? {connect: {ID: LID_ID}} : undefined,
            NAAM: lid.NAAM,
         };
      }

      updateData.TIJDSTIP = parseDateOnly(updateData.TIJDSTIP as Date | string);

      const obj = await this.dbService.operBrandstof.update({
         where: {
            ID: id
         },
         data: updateData
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, updateData, obj);
      const result = {...obj, TIJDSTIP: toDateOnly(obj.TIJDSTIP) as unknown as Date};
      this.logger.verbose(`BrandstofService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`BrandstofService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operBrandstof.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
