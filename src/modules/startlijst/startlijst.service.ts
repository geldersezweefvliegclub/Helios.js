import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperStartlijst} from "@prisma/client";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";

// startlijst record inclusief de relaties die de PHP startlijst_view samenvoegt
type StartlijstMetRelaties = Prisma.OperStartlijstGetPayload<{
   include: {
      Vliegtuig: {include: {VliegtuigType: true}},
      Sleepkist: true,
      Vlieger: true,
      Inzittende: true,
      Startmethode: true,
      Veld: true,
      Baan: true,
   }
}>;

@Injectable()
export class StartlijstService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperStartlijst>
   {
      // relation is included for consistency with other services, but not used.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de startlijst_view.
      const db = await this.dbService.operStartlijst.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Startlijst record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperStartlijstRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);

      // DDWV is geen kolom op oper_startlijst maar afgeleid van oper_daginfo/oper_rooster op DATUM, zie startlijst_view
      let ddwvDatums: Date[] | undefined;
      if (params.DDWV)
         ddwvDatums = await this.DDWVDatums();

      const where: Prisma.OperStartlijstWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { VLIEGTUIG_ID: params.VLIEGTUIG_ID },
                  { STARTMETHODE_ID: params.STARTMETHODE_ID },
                  params.LID_ID ? { OR: [{ VLIEGER_ID: params.LID_ID }, { INZITTENDE_ID: params.LID_ID }] } : {},
                  params.OPEN_STARTS ? { OR: [{ LANDINGSTIJD: null }, { VLIEGER_ID: null }] } : {},
                  params.DDWV ? { DATUM: { in: ddwvDatums } } : {},
                  params.SELECTIE ? {
                     OR: [
                        { Vlieger: { NAAM: { contains: params.SELECTIE } } },
                        { Inzittende: { NAAM: { contains: params.SELECTIE } } },
                        { VLIEGERNAAM: { contains: params.SELECTIE } },
                        { INZITTENDENAAM: { contains: params.SELECTIE } },
                        { Vliegtuig: { REGISTRATIE: { contains: params.SELECTIE } } },
                        { Vliegtuig: { CALLSIGN: { contains: params.SELECTIE } } },
                     ]
                  } : {},
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
         count = await this.dbService.operStartlijst.count({where: where});
      }
      const objs = await this.dbService.operStartlijst.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperStartlijstOrderByWithRelationInput>(params.SORT ?? "DATUM DESC, DAGNUMMER"),
         take: params.MAX,
         skip: params.START,
         include: {
            Vliegtuig: {include: {VliegtuigType: true}},
            Sleepkist: true,
            Vlieger: true,
            Inzittende: true,
            Startmethode: true,
            Veld: true,
            Baan: true,
         }
      });

      const response = await this.NaarGetObjectsResponse(objs);

      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   // datums waarop een DDWV bedrijf gepland staat, via oper_daginfo of oper_rooster (zie startlijst_view)
   private async DDWVDatums(): Promise<Date[]>
   {
      const [daginfo, rooster] = await Promise.all([
         this.dbService.operDagInfo.findMany({where: {DDWV: true}, select: {DATUM: true}}),
         this.dbService.operRooster.findMany({where: {DDWV: true}, select: {DATUM: true}}),
      ]);
      return [...daginfo, ...rooster].map(record => record.DATUM);
   }

   // voegt de velden toe die de PHP startlijst_view samenvoegt: vliegtuig-, lid-, en type-gegevens via joins,
   // de berekende vliegduur, en de DDWV vlag via een gebatchte datum-lookup op oper_daginfo/oper_rooster
   private async NaarGetObjectsResponse(objs: StartlijstMetRelaties[]): Promise<GetObjectsOperStartlijstResponse[]>
   {
      if (objs.length === 0) return [];

      const ddwvDatums = new Set((await this.DDWVDatums()).map(datum => datum.getTime()));

      return objs.map(obj =>
      {
         const {Vliegtuig: vliegtuig, Sleepkist: sleepkist, Vlieger: vlieger, Inzittende: inzittende,
            Startmethode: startmethode, Veld: veld, Baan: baan, ...startlijst} = obj;

         return {
            ...startlijst,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: `${vliegtuig.REGISTRATIE ?? ''} (${vliegtuig.CALLSIGN ?? ''})`,
            CLUBKIST: vliegtuig.CLUBKIST,
            VLIEGTUIG_TYPE_ID: vliegtuig.TYPE_ID,
            VLIEGTUIGTYPE: vliegtuig.VliegtuigType?.OMSCHRIJVING ?? null,
            SLEEPKIST: sleepkist ? `${sleepkist.REGISTRATIE ?? ''} (${sleepkist.CALLSIGN ?? ''})` : null,
            VLIEGERNAAM_LID: vlieger?.NAAM ?? null,
            INZITTENDENAAM_LID: inzittende?.NAAM ?? null,
            VLIEGER_LIDTYPE_ID: vlieger?.LIDTYPE_ID ?? null,
            INZITTENDE_LIDTYPE_ID: inzittende?.LIDTYPE_ID ?? null,
            STARTMETHODE: startmethode?.OMSCHRIJVING ?? null,
            VELD: veld?.OMSCHRIJVING ?? null,
            BAAN: baan?.CODE ?? null,
            DUUR: this.BerekenDuur(startlijst.DATUM, startlijst.STARTTIJD, startlijst.LANDINGSTIJD),
            DDWV: ddwvDatums.has(startlijst.DATUM.getTime()),
         } as GetObjectsOperStartlijstResponse;
      });
   }

   // zie DUUR berekening in de startlijst_view: verstreken tijd tot nu (als het vandaag is en nog niet geland),
   // of het verschil tussen start- en landingstijd, of leeg als er nog geen landingstijd is op een andere dag
   private BerekenDuur(datum: Date, starttijd: Date | null, landingstijd: Date | null): string
   {
      if (!starttijd) return '';

      const vandaag = new Date();
      const isVandaag = datum.toDateString() === vandaag.toDateString();

      let eindTijd: Date | null = landingstijd;
      if (!eindTijd)
      {
         if (!isVandaag) return '';
         eindTijd = vandaag;
      }

      const minuten = Math.max(0, Math.round((this.MinutenSindsMiddernacht(eindTijd) - this.MinutenSindsMiddernacht(starttijd) + 1440) % 1440));
      return `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
   }

   private MinutenSindsMiddernacht(tijd: Date): number
   {
      return tijd.getUTCHours() * 60 + tijd.getUTCMinutes();
   }

   // bepaalt het volgnummer van de vlucht op die dag, zie NieuwDagNummer() in class.Startlijst.inc.php
   private async NieuwDagNummer(datum: Date): Promise<number>
   {
      const laatste = await this.dbService.operStartlijst.findFirst({
         where: {DATUM: datum},
         orderBy: {DAGNUMMER: 'desc'},
      });
      return (laatste?.DAGNUMMER ?? 0) + 1;
   }

   // controleert of start- en landingstijd geldig zijn, zie StartLandingTijdenValidatie() in class.Startlijst.inc.php
   private ValideerStartLandingTijden(starttijd: Date | null | undefined, landingstijd: Date | null | undefined): void
   {
      if (starttijd === undefined || landingstijd === undefined) return; // niet allebei opgegeven, niets te doen

      if (starttijd == null && landingstijd != null)
         throw new HttpException("Starttijd ontbreekt", HttpStatus.BAD_REQUEST);

      if (starttijd != null && landingstijd != null)
      {
         if (this.MinutenSindsMiddernacht(landingstijd) <= this.MinutenSindsMiddernacht(starttijd))
            throw new HttpException(`Landingstijd moet later zijn dan de starttijd`, HttpStatus.CONFLICT);
      }
   }

   // een instructievlucht kan niet in een eenzitter, en vereist een instructeur als inzittende,
   // zie InstructieVlucht() in class.Startlijst.inc.php
   private async ValideerInstructieVlucht(vliegtuigId: number | undefined, inzittendeId: number | null | undefined, instructievlucht: boolean | undefined): Promise<boolean | undefined>
   {
      if (vliegtuigId !== undefined)
      {
         const vliegtuig = await this.dbService.refVliegtuig.findUnique({where: {ID: vliegtuigId}});
         if (vliegtuig?.ZITPLAATSEN === 1)
            return false; // eenzitter, kan nooit een instructievlucht zijn
      }

      if (instructievlucht && inzittendeId != null)
      {
         const inzittende = await this.dbService.refLid.findUnique({where: {ID: inzittendeId}});
         if (!inzittende?.INSTRUCTEUR)
            throw new HttpException("Instructie vlucht kan alleen door een instructeur worden gedaan", HttpStatus.CONFLICT);
      }

      return instructievlucht;
   }

   async AddObject(data: Prisma.OperStartlijstUncheckedCreateInput): Promise<OperStartlijst>
   {
      this.ValideerStartLandingTijden(data.STARTTIJD as Date | null | undefined, data.LANDINGSTIJD as Date | null | undefined);

      const instructievlucht = await this.ValideerInstructieVlucht(data.VLIEGTUIG_ID, data.INZITTENDE_ID, data.INSTRUCTIEVLUCHT as boolean | undefined);
      if (instructievlucht !== undefined)
         data.INSTRUCTIEVLUCHT = instructievlucht;

      data.DAGNUMMER = await this.NieuwDagNummer(data.DATUM as Date);

      const obj = await this.dbService.operStartlijst.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperStartlijstUncheckedUpdateInput): Promise<OperStartlijst>
   {
      const db = await this.GetObject(id);

      const nieuweStarttijd = data.STARTTIJD !== undefined ? data.STARTTIJD as Date | null : db.STARTTIJD;
      const nieuweLandingstijd = data.LANDINGSTIJD !== undefined ? data.LANDINGSTIJD as Date | null : db.LANDINGSTIJD;
      this.ValideerStartLandingTijden(nieuweStarttijd, nieuweLandingstijd);

      const nieuweInzittende = data.INZITTENDE_ID !== undefined ? data.INZITTENDE_ID as number | null : db.INZITTENDE_ID;
      const nieuweInstructievlucht = data.INSTRUCTIEVLUCHT !== undefined ? data.INSTRUCTIEVLUCHT as boolean : undefined;
      const instructievlucht = await this.ValideerInstructieVlucht(data.VLIEGTUIG_ID as number | undefined, nieuweInzittende, nieuweInstructievlucht);
      if (instructievlucht !== undefined)
         data.INSTRUCTIEVLUCHT = instructievlucht;

      // als de datum aangepast is, dan een nieuw dagnummer toekennen, zie UpdateObject() in class.Startlijst.inc.php
      const nieuweDatum = data.DATUM as Date | undefined;
      if (nieuweDatum !== undefined && nieuweDatum.valueOf() !== db.DATUM.valueOf())
         data.DAGNUMMER = await this.NieuwDagNummer(nieuweDatum);

      const obj = await this.dbService.operStartlijst.update({
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
      await this.dbService.operStartlijst.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}