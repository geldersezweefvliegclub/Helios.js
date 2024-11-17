import {HttpException, HttpStatus, Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Prisma, PrismaClient, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {DatabaseEvents} from "../../core/helpers/Events";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GetObjectsRefLedenRequest} from "./LedenDTO";
import {hash} from "bcryptjs";

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

      const view = `
         SELECT
            l.*,
            t.OMSCHRIJVING AS LIDTYPE,
            t.EXT_REF AS LIDTYPE_REF,
            s.OMSCHRIJVING AS STATUS,
            z.NAAM AS ZUSTERCLUB,
            b.NAAM AS BUDDY,
            b2.NAAM AS BUDDY2
         FROM
            ref_leden l
            LEFT JOIN ref_types t ON (l.LIDTYPE_ID = t.ID)
            LEFT JOIN ref_types s ON (l.STATUSTYPE_ID = s.ID)
            LEFT JOIN ref_leden z ON (l.ZUSTERCLUB_ID = z.ID)
            LEFT JOIN ref_leden b ON (l.BUDDY_ID = b.ID)
            LEFT JOIN ref_leden b2 ON (l.BUDDY_ID = b2.ID)
         WHERE
             l.VERWIJDERD = #WHERE#
         ORDER BY
             ACHTERNAAM, VOORNAAM;`

      const prisma = new PrismaClient()

      prisma.$executeRawUnsafe("CREATE OR REPLACE VIEW leden_view AS " + view.replace("#WHERE#", "0")).catch(e => this.logger.error(e));
      prisma.$executeRawUnsafe("CREATE OR REPLACE VIEW verwijderd_leden_view AS " + view.replace("#WHERE#", "1")).catch(e => this.logger.error(e));
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

   async GetObjectsByQuery(params: GetObjectsRefLedenRequest): Promise<any>
   {
      const fields = params.VELDEN ? params.VELDEN : "*";
      const where = ["WHERE 1=1"];
      if (params.ID)
         where.push("AND ID = " + params.ID);
      if (params.IDs)
         where.push("AND ID IN (" + params.IDs.join(",") + ")");
      if (params.SELECTIE)
         where.push("AND (NAAM LIKE '%" + params.SELECTIE + "%' OR EMAIL LIKE '%" + params.SELECTIE + "%' OR TELEFOON LIKE '%" + params.SELECTIE + "%' OR MOBIEL LIKE '%" + params.SELECTIE + "%' OR NOODNUMMER LIKE '%" + params.SELECTIE + "%')");
      if (params.TYPES)
         where.push("AND LIDTYPE_ID IN (" + params.TYPES.join(",") + ")");
      if (params.CLUBLEDEN)
         where.push("AND LIDTYPE_ID >= 600 AND LIDTYPE_ID <= 606");
      if (params.INSTRUCTEURS)
         where.push("AND INSTRUCTEUR = 1");
      if (params.LIERISTEN)
         where.push("AND LIERIST = 1");
      if (params.LIO)
         where.push("AND LIERIST_IO = 1");
      if (params.STARTLEIDERS)
         where.push("AND STARTLEIDER = 1");
      if (params.DDWV_CREW)
         where.push("AND DDWV_CREW = 1");
      if (params.BEHEERDERS)
         where.push("AND BEHEERDER = 1");

      const orderby = params.SORT ? "ORDER BY " + params.SORT : "ORDER BY ACHTERNAAM, VOORNAAM";

      const SQL = ("SELECT " + fields + " FROM ####leden_view" + " " + where.join(" ") + " " + orderby).replaceAll("####", params.VERWIJDERD ? "verwijderd_" : "");

      const results = await this.dbService.dbQuery(SQL, params.START, params.MAX);

      console.log(results[0])
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
