import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {DbService} from '../../database/db-service/db.service';
import {IHeliosService} from '../../core/services/IHeliosService';
import {PermissieService} from '../authorisatie/permissie.service';
import {GetLogboekRequest} from './GetLogboekRequest';
import {GetLogboekTotalenRequest} from './GetLogboekTotalenRequest';
import {GetObjectsStartlijstRequest} from './GetObjectsStartlijstRequest';
import {GetVliegtuigLogboekRequest} from './GetVliegtuigLogboekRequest';
import {GetVliegtuigLogboekTotalenRequest} from './GetVliegtuigLogboekTotalenRequest';
import {GetVliegDagenRequest} from './GetVliegDagenRequest';
import {
   GetObjectsStartlijstResponse,
   GetLogboekResponse,
   GetLogboekRowResponse,
   GetLogboekTotalenResponse,
   GetRecencyResponse,
   GetVliegDagenResponse,
   GetVliegtuigLogboekResponse,
   GetVliegtuigLogboekTotalenResponse,
   StartlijstObjectResponse,
} from './startlijst.responses';

type SqlRow = Record<string, unknown>;

@Injectable()
export class StartlijstService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly permissieService: PermissieService)
   {
      super();
   }

   async GetObject(user: RefLid, id: number): Promise<StartlijstObjectResponse>
   {
      if (id === undefined || id === null) {
         throw new HttpException('Geen ID in aanroep', HttpStatus.NOT_ACCEPTABLE);
      }

      const row = await this.dbService.operStartlijst.findUnique({
         where: {ID: id},
      });
      if (!row) {
         throw new HttpException(`Record niet gevonden (Startlijst, '{"ID":${id}}')`, HttpStatus.NOT_FOUND);
      }

      const datum = this.formatDateValue(row.DATUM);
      const fullAccess = await this.hasStartlijstDataAccess(user, datum);
      if (!fullAccess && this.toNumberValue(row.VLIEGER_ID) !== user.ID && this.toNumberValue(row.INZITTENDE_ID) !== user.ID) {
         throw new HttpException('Geen leesrechten voor dit record', HttpStatus.UNAUTHORIZED);
      }

      return this.normalizeStartlijstRecord(row as unknown as SqlRow) as unknown as StartlijstObjectResponse;
   }

   async GetObjects(user: RefLid, params: GetObjectsStartlijstRequest): Promise<GetObjectsStartlijstResponse>
   {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      const deletedOnly = params.VERWIJDERD ?? false;

      if (!await this.hasStartlijstDataAccess(user) && !this.permissieService.isStarttoren(user) && !this.permissieService.isRapporteur(user)) {
         const visibility: Prisma.Sql[] = [
            Prisma.sql`(VLIEGER_ID = ${user.ID})`,
            Prisma.sql`(INZITTENDE_ID = ${user.ID})`,
         ];

         if (this.permissieService.isBeheerderDDWV(user)) {
            visibility.push(Prisma.sql`(DDWV = 1)`);
         }
         if (this.permissieService.isDDWVCrew(user)) {
            visibility.push(Prisma.sql`((DATUM IN (SELECT DATUM FROM oper_diensten WHERE LID_ID = ${user.ID})) AND (DDWV = 1))`);
         }

         conditions.push(Prisma.sql`(${Prisma.join(visibility, ' OR ')})`);
      }

      if (this.permissieService.isStarttoren(user)) {
         conditions.push(Prisma.sql`DATUM = ${this.toSqlDate(new Date())}`);
      }

      if (params.ID !== undefined) {
         conditions.push(Prisma.sql`ID = ${params.ID}`);
      }
      if (params.BEGIN_DATUM) {
         conditions.push(Prisma.sql`DATE(DATUM) >= ${this.toSqlDate(params.BEGIN_DATUM)}`);
      }
      if (params.EIND_DATUM) {
         conditions.push(Prisma.sql`DATE(DATUM) <= ${this.toSqlDate(params.EIND_DATUM)}`);
      }
      if (params.STARTMETHODE_ID !== undefined) {
         conditions.push(Prisma.sql`STARTMETHODE_ID = ${params.STARTMETHODE_ID}`);
      }
      if (params.LID_ID !== undefined) {
         conditions.push(Prisma.sql`((VLIEGER_ID = ${params.LID_ID}) OR (INZITTENDE_ID = ${params.LID_ID}))`);
      }
      if (params.VLIEGTUIG_ID !== undefined) {
         conditions.push(Prisma.sql`VLIEGTUIG_ID = ${params.VLIEGTUIG_ID}`);
      }
      if (params.OPEN_STARTS) {
         conditions.push(Prisma.sql`(LANDINGSTIJD IS NULL OR VLIEGER_ID IS NULL)`);
      }
      if (params.DDWV) {
         conditions.push(Prisma.sql`DDWV = 1`);
      }
      if (params.SELECTIE) {
         const selection = `%${params.SELECTIE.trim()}%`;
         conditions.push(Prisma.sql`(
            (VLIEGERNAAM_LID LIKE ${selection}) OR
            (INZITTENDENAAM_LID LIKE ${selection}) OR
            (VLIEGERNAAM LIKE ${selection}) OR
            (INZITTENDENAAM LIKE ${selection}) OR
            (REG_CALL LIKE ${selection})
         )`);
      }

      const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
      const viewName = deletedOnly ? Prisma.raw('verwijderd_startlijst_view') : Prisma.raw('startlijst_view');
      const sort = this.buildLooseSortClause(params.SORT, 'DATUM DESC, DAGNUMMER');
      const totaal = await this.querySingleNumber(Prisma.sql`SELECT COUNT(*) AS totaal FROM ${viewName} ${where}`, 'totaal');
      const laatsteAanpassing = await this.querySingleDateTime(Prisma.sql`SELECT MAX(LAATSTE_AANPASSING) AS laatste_aanpassing FROM ${viewName} ${where}`, 'laatste_aanpassing');

      const fields = this.buildSelectClause(params.VELDEN);
      const limit = this.buildLimitClause(params.START, params.MAX);
      const rows = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT ${fields}
         FROM ${viewName}
         ${where}
         ${sort}
         ${limit}
      `);

      const dataset = rows.map((row) => this.normalizeStartlijstRecord(row)) as unknown as GetObjectsStartlijstResponse['dataset'];

      return {
         totaal,
         laatste_aanpassing: laatsteAanpassing,
         dataset,
      };
   }

   async GetLogboek(user: RefLid, params: GetLogboekRequest): Promise<GetLogboekResponse>
   {
      const lidId = params.LID_ID ?? user.ID;
      const where = await this.buildLidLogboekWhere(user, lidId, params.VLIEGTUIG_ID, params.JAAR, params.BEGIN_DATUM, params.EIND_DATUM);
      const totaal = await this.countRows(where);
      const laatsteAanpassing = await this.getLaatsteAanpassing(where);

      const orderBy = this.buildSortClause(params.SORT, ['ID', 'DATUM', 'STARTTIJD', 'LANDINGSTIJD', 'VLIEGTUIG_ID', 'VLIEGER_ID', 'INZITTENDE_ID']);
      const paging = this.buildLimitClause(params.START, params.MAX);
      const rows = await this.dbService.$queryRaw<GetLogboekRowResponse[]>(Prisma.sql`
         SELECT
            ID,
            DATUM,
            REG_CALL,
            VLIEGTUIG_ID,
            CAST(STARTTIJD AS CHAR) AS STARTTIJD,
            CAST(LANDINGSTIJD AS CHAR) AS LANDINGSTIJD,
            DUUR,
            IF (VLIEGERNAAM IS NULL, VLIEGERNAAM_LID, CONCAT(VLIEGERNAAM_LID, '(', VLIEGERNAAM, ')')) AS VLIEGERNAAM,
            IF (
               PAX = 1,
               INZITTENDENAAM,
               IF (INZITTENDENAAM IS NULL, INZITTENDENAAM_LID, CONCAT(INZITTENDENAAM_LID, '(', INZITTENDENAAM, ')'))
            ) AS INZITTENDENAAM,
            VLIEGER_ID,
            INZITTENDE_ID,
            STARTMETHODE,
            VELD,
            PAX,
            INSTRUCTIEVLUCHT,
            CHECKSTART,
            VLIEGTUIGTYPE,
            OPMERKINGEN,
            LAATSTE_AANPASSING
         FROM startlijst_view
         ${where}
         ${orderBy}
         ${paging}
      `);

      const dataset = rows.map((row) => this.normalizeLogboekRow(row));
      return {
         totaal,
         laatste_aanpassing: laatsteAanpassing,
         dataset,
      };
   }

   async GetLogboekTotalen(user: RefLid, params: GetLogboekTotalenRequest): Promise<GetLogboekTotalenResponse>
   {
      const lidId = params.LID_ID ?? user.ID;
      const where = await this.buildLidLogboekWhere(user, lidId, undefined, params.JAAR ?? new Date().getFullYear(), undefined, undefined, true);
      const totaal = await this.countRows(where, true);
      const laatsteAanpassing = await this.getLaatsteAanpassing(where, true);

      const logboek = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT REG_CALL, STARTMETHODE, DUUR, INSTRUCTIEVLUCHT, INZITTENDE_ID
         FROM startlijst_view slv
         INNER JOIN ref_vliegtuigen rv ON slv.VLIEGTUIG_ID = rv.ID
         ${where}
         ORDER BY rv.CLUBKIST DESC, rv.VOLGORDE, slv.REG_CALL
      `);

      const starts = new Map<string, {METHODE: string | null, AANTAL: number}>();
      const vliegtuigen = new Map<string, {REG_CALL: string, STARTS: number, VLIEGTIJD: number}>();
      let totaalStarts = 0;
      let totaalMinuten = 0;
      let instructieStarts = 0;
      let instructieMinuten = 0;

      for (const row of logboek) {
         const regCall = this.toStringValue(row.REG_CALL);
         const startMethode = this.toStringValue(row.STARTMETHODE);
         const minuten = this.durationToMinutes(this.toStringValue(row.DUUR));

         totaalStarts += 1;
         totaalMinuten += minuten;

         if (!vliegtuigen.has(regCall)) {
            vliegtuigen.set(regCall, {REG_CALL: regCall, STARTS: 0, VLIEGTIJD: 0});
         }
         const vliegtuig = vliegtuigen.get(regCall);
         vliegtuig.STARTS += 1;
         vliegtuig.VLIEGTIJD += minuten;

         if (!starts.has(startMethode ?? '')) {
            starts.set(startMethode ?? '', {METHODE: startMethode, AANTAL: 0});
         }
         starts.get(startMethode ?? '').AANTAL += 1;

         if (this.permissieService.isInstructeur(user) && this.toNumberValue(row.INZITTENDE_ID) === lidId) {
            instructieStarts += 1;
            instructieMinuten += minuten;
         }
      }

      const response: GetLogboekTotalenResponse = {
         totaal,
         laatste_aanpassing: laatsteAanpassing,
         starts: Array.from(starts.values()),
         vliegtuigen: Array.from(vliegtuigen.values()).map((item) => ({
            ...item,
            VLIEGTIJD: this.minutesToDuration(item.VLIEGTIJD),
         })),
         jaar: {
            STARTS: totaalStarts,
            INSTRUCTIE_STARTS: instructieStarts,
            INSTRUCTIE_UREN: this.minutesToDuration(instructieMinuten),
            VLIEGTIJD: this.minutesToDuration(totaalMinuten),
         },
      };

      return response;
   }

   async GetVliegtuigLogboek(user: RefLid, params: GetVliegtuigLogboekRequest): Promise<GetVliegtuigLogboekResponse>
   {
      const vliegtuigId = this.requireVliegtuigId(params.ID);
      await this.ensureAircraftLogboekAccess(user, vliegtuigId);

      const where = this.buildVliegtuigWhere(vliegtuigId, params.BEGIN_DATUM, params.EIND_DATUM);
      const totaalRow = await this.dbService.$queryRaw<{totaal: bigint | number}[]>(Prisma.sql`
         SELECT COUNT(DISTINCT(DATUM)) AS totaal
         FROM startlijst_view slv
         ${where}
      `);
      const totaal = Number(totaalRow[0]?.totaal ?? 0);
      const laatsteAanpassing = await this.getLaatsteAanpassing(where, true);

      const paging = this.buildLimitClause(params.START, params.MAX);
      const rows = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT
            DATUM,
            COUNT(*) AS VLUCHTEN,
            SUM(CASE WHEN STARTMETHODE_ID >= 550 THEN 1 ELSE 0 END) AS LIERSTARTS,
            SUM(CASE WHEN STARTMETHODE_ID = 501 THEN 1 ELSE 0 END) AS SLEEPSTARTS,
            CAST(SEC_TO_TIME(SUM(TIME_TO_SEC(STR_TO_DATE(DUUR, '%H:%i')))) AS CHAR) AS VLIEGTIJD,
            REG_CALL
         FROM startlijst_view slv
         ${where}
         GROUP BY DATUM, REG_CALL
         ORDER BY DATUM DESC
         ${paging}
      `);

      const dataset = rows.map((row) => ({
         DATUM: this.formatDateValue(row.DATUM),
         VLUCHTEN: this.toNumberValue(row.VLUCHTEN),
         LIERSTARTS: this.toNumberValue(row.LIERSTARTS),
         SLEEPSTARTS: this.toNumberValue(row.SLEEPSTARTS),
         VLIEGTIJD: this.trimTime(this.toStringValue(row.VLIEGTIJD) ?? '00:00:00'),
         REG_CALL: this.toStringValue(row.REG_CALL),
      }));

      return {
         totaal,
         laatste_aanpassing: laatsteAanpassing,
         dataset,
      };
   }

   async GetVliegtuigLogboekTotalen(user: RefLid, params: GetVliegtuigLogboekTotalenRequest): Promise<GetVliegtuigLogboekTotalenResponse>
   {
      const vliegtuigId = this.requireVliegtuigId(params.ID);
      await this.ensureAircraftLogboekAccess(user, vliegtuigId);

      const year = params.JAAR ?? new Date().getFullYear();
      const where = Prisma.sql`
         WHERE STARTTIJD IS NOT NULL
           AND LANDINGSTIJD IS NOT NULL
           AND VLIEGTUIG_ID = ${vliegtuigId}
           AND YEAR(DATUM) = ${year}
      `;
      const laatsteAanpassing = await this.getLaatsteAanpassing(where, true);

      const rows = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT
            MONTH(DATUM) AS MAAND,
            COUNT(*) AS VLUCHTEN,
            SUM(CASE WHEN STARTMETHODE_ID >= 550 THEN 1 ELSE 0 END) AS LIERSTARTS,
            SUM(CASE WHEN STARTMETHODE_ID = 501 THEN 1 ELSE 0 END) AS SLEEPSTARTS,
            CAST(SEC_TO_TIME(SUM(TIME_TO_SEC(STR_TO_DATE(DUUR, '%H:%i')))) AS CHAR) AS VLIEGTIJD,
            REG_CALL
         FROM startlijst_view slv
         ${where}
         GROUP BY MONTH(DATUM), REG_CALL
         ORDER BY DATUM DESC
      `);

      const months = Array.from({length: 12}, (_, index) => ({
         MAAND: index + 1,
         VLUCHTEN: 0,
         LIERSTARTS: 0,
         SLEEPSTARTS: 0,
         VLIEGTIJD: '00:00:00',
         REG_CALL: '',
      }));
      let totalDuration = '00:00:00';
      let totalFlights = 0;
      let totalLier = 0;
      let totalSleep = 0;

      for (const row of rows) {
         const monthIndex = this.toNumberValue(row.MAAND) - 1;
         if (monthIndex < 0 || monthIndex > 11) {
            continue;
         }

         const vliegtijd = this.toStringValue(row.VLIEGTIJD) ?? '00:00:00';
         months[monthIndex] = {
            MAAND: this.toNumberValue(row.MAAND),
            VLUCHTEN: this.toNumberValue(row.VLUCHTEN),
            LIERSTARTS: this.toNumberValue(row.LIERSTARTS),
            SLEEPSTARTS: this.toNumberValue(row.SLEEPSTARTS),
            VLIEGTIJD: vliegtijd,
            REG_CALL: this.toStringValue(row.REG_CALL),
         };

         totalFlights += this.toNumberValue(row.VLUCHTEN);
         totalLier += this.toNumberValue(row.LIERSTARTS);
         totalSleep += this.toNumberValue(row.SLEEPSTARTS);
         totalDuration = this.sumClockDurations(totalDuration, vliegtijd);
      }

      return {
         totaal: 12,
         laatste_aanpassing: laatsteAanpassing,
         totalen: {
            VLUCHTEN: totalFlights,
            LIERSTARTS: totalLier,
            SLEEPSTARTS: totalSleep,
            VLIEGTIJD: totalDuration,
         },
         dataset: months,
      };
   }

   async GetVliegDagen(user: RefLid, params: GetVliegDagenRequest): Promise<GetVliegDagenResponse>
   {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];

      if (!await this.hasStartlijstDataAccess(user) && !this.permissieService.isRapporteur(user)) {
         const visibility: Prisma.Sql[] = [
            Prisma.sql`(VLIEGER_ID = ${user.ID})`,
            Prisma.sql`(INZITTENDE_ID = ${user.ID})`,
         ];

         if (this.permissieService.isBeheerderDDWV(user)) {
            visibility.push(Prisma.sql`(DATUM IN (SELECT DATUM FROM oper_rooster WHERE DDWV = 1))`);
         }
         if (this.permissieService.isDDWVCrew(user)) {
            visibility.push(Prisma.sql`((DATUM IN (SELECT DATUM FROM oper_diensten WHERE LID_ID = ${user.ID})) AND (DATUM IN (SELECT DATUM FROM oper_rooster WHERE DDWV = 1)))`);
         }

         conditions.push(Prisma.sql`(${Prisma.join(visibility, ' OR ')})`);

         if (this.permissieService.isStarttoren(user)) {
            conditions.push(Prisma.sql`DATUM = ${this.toSqlDate(new Date())}`);
         }
      }

      if (params.BEGIN_DATUM) {
         conditions.push(Prisma.sql`DATE(DATUM) >= ${this.toSqlDate(params.BEGIN_DATUM)}`);
      }
      if (params.EIND_DATUM) {
         conditions.push(Prisma.sql`DATE(DATUM) <= ${this.toSqlDate(params.EIND_DATUM)}`);
      }
      if (params.LID_ID !== undefined) {
         conditions.push(Prisma.sql`((VLIEGER_ID = ${params.LID_ID}) OR (INZITTENDE_ID = ${params.LID_ID}))`);
      }
      if (!params.BEGIN_DATUM && !params.EIND_DATUM) {
         const year = new Date().getFullYear();
         const yearStart = `${year}-01-01`;
         const yearEnd = `${year}-12-31`;
         conditions.push(Prisma.sql`DATE(DATUM) >= ${yearStart}`, Prisma.sql`DATE(DATUM) <= ${yearEnd}`);
      }

      const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
      const orderBy = this.buildLooseSortClause(params.SORT, 'DATUM');
      const totalQuery = Prisma.sql`
         SELECT COUNT(*) AS totaal
         FROM (
            SELECT DATUM
            FROM startlijst_view
            ${where}
            GROUP BY DATUM
         ) AS d
      `;
      const totaal = await this.querySingleNumber(totalQuery, 'totaal');
      const laatsteAanpassing = await this.querySingleDateTime(Prisma.sql`SELECT MAX(LAATSTE_AANPASSING) AS laatste_aanpassing FROM startlijst_view ${where}`, 'laatste_aanpassing');
      const limit = params.MAX && params.MAX > 0 ? Prisma.sql`LIMIT 0, ${params.MAX}` : Prisma.empty;

      const rows = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT DATUM, COUNT(*) AS STARTS, CAST(SEC_TO_TIME(SUM(TIME_TO_SEC(STR_TO_DATE(DUUR, '%H:%i')))) AS CHAR) AS VLIEGTIJD
         FROM startlijst_view
         ${where}
         GROUP BY DATUM
         ${orderBy}
         ${limit}
      `);

      return {
         totaal,
         laatste_aanpassing: laatsteAanpassing,
         dataset: rows.map((row) => ({
            DATUM: this.formatDateValue(row.DATUM),
            STARTS: this.toNumberValue(row.STARTS),
            VLIEGTIJD: this.trimTime(this.toStringValue(row.VLIEGTIJD)),
         })),
      };
   }

   async GetRecency(user: RefLid, vliegerId: number, datum?: Date): Promise<GetRecencyResponse>
   {
      if (vliegerId === undefined || vliegerId === null) {
         throw new HttpException('VLIEGER_ID moet ingevuld zijn', HttpStatus.NOT_ACCEPTABLE);
      }
      if (vliegerId !== user.ID && !await this.hasStartlijstDataAccess(user) && !this.permissieService.isRapporteur(user)) {
         throw new HttpException('Geen leesrechten', HttpStatus.UNAUTHORIZED);
      }

      const peildatum = datum ?? new Date();
      const targetLid = await this.dbService.refLid.findUnique({
         where: {ID: vliegerId},
         select: {INSTRUCTEUR: true},
      });
      if (!targetLid) {
         throw new HttpException(`Lid record met ID ${vliegerId} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      const fromYear = peildatum.getFullYear() - 2;
      const fromYearStart = `${fromYear}-01-01`;
      const queryWhere = targetLid.INSTRUCTEUR
         ? Prisma.sql`DATUM > ${fromYearStart} AND DATUM <= ${this.toSqlDate(peildatum)} AND STARTTIJD IS NOT NULL AND LANDINGSTIJD IS NOT NULL AND ((VLIEGER_ID = ${vliegerId}) OR ((INZITTENDE_ID = ${vliegerId}) AND (INSTRUCTIEVLUCHT = 1)))`
         : Prisma.sql`DATUM > ${fromYearStart} AND DATUM <= ${this.toSqlDate(peildatum)} AND STARTTIJD IS NOT NULL AND LANDINGSTIJD IS NOT NULL AND ((VLIEGER_ID = ${vliegerId}) OR (1 = 0))`;

      const flights = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
         SELECT DATUM, DUUR, CHECKSTART, VLIEGER_ID, STARTMETHODE_ID
         FROM startlijst_view
         WHERE ${queryWhere}
         ORDER BY DATUM DESC
      `);

      const nowYear = new Date().getFullYear();
      const result: GetRecencyResponse = {
         STARTS_DRIE_MND: 0,
         STARTS_24_MND: 0,
         STARTS_VORIG_JAAR: 0,
         STARTS_DIT_JAAR: 0,
         STARTS_INSTRUCTIE: -1,
         UREN_DRIE_MND: '0:00',
         UREN_24_MND: '0:00',
         UREN_DIT_JAAR: '0:00',
         UREN_VORIG_JAAR: '0:00',
         UREN_INSTRUCTIE: '0:00',
         STATUS_BAROMETER: 'onbekend',
         WAARDE: 0,
         STARTS_BAROMETER: 0,
         UREN_BAROMETER: '0:00',
         LIERSTARTS: 0,
         SLEEPSTARTS: 0,
         ZELFSTARTS: 0,
         TMGSTARTS: 0,
         CHECKS: [],
      };

      let urenDrieMnd = 0;
      let uren24Mnd = 0;
      let urenDitJaar = 0;
      let urenVorigJaar = 0;
      let urenInstructie = 0;
      let urenBarometer = 0;

      for (const flight of flights) {
         const flightDate = new Date(this.formatDateValue(flight.DATUM));
         const diffDays = Math.abs(peildatum.getTime() - flightDate.getTime()) / (1000 * 60 * 60 * 24);
         const duration = this.durationToMinutes(this.toStringValue(flight.DUUR));

         if (diffDays < 13 * 7) {
            result.STARTS_DRIE_MND += 1;
            urenDrieMnd += duration;
         }
         if (diffDays <= 26 * 7) {
            result.STARTS_BAROMETER += 1;
            urenBarometer += duration;
         }
         if (diffDays < 104 * 7) {
            if (this.toBooleanValue(flight.CHECKSTART) && this.toNumberValue(flight.VLIEGER_ID) === vliegerId) {
               const datumString = this.formatDateValue(flight.DATUM).split('-');
               result.CHECKS.push(`${datumString[2]}-${datumString[1]}-${datumString[0]}`);
            }

            switch (this.toStringLikeValue(flight.STARTMETHODE_ID)) {
               case '501':
                  result.SLEEPSTARTS += 1;
                  break;
               case '506':
                  result.ZELFSTARTS += 1;
                  break;
               case '507':
                  result.TMGSTARTS += 1;
                  break;
               case '550':
                  result.LIERSTARTS += 1;
                  break;
            }
            result.STARTS_24_MND += 1;
            uren24Mnd += duration;
         }

         if (this.formatDateValue(flight.DATUM).startsWith(String(nowYear))) {
            result.STARTS_DIT_JAAR += 1;
            urenDitJaar += duration;
         }
         if (this.formatDateValue(flight.DATUM).startsWith(String(nowYear - 1))) {
            result.STARTS_VORIG_JAAR += 1;
            urenVorigJaar += duration;
         }
      }

      const y1 = urenBarometer / 60;
      const y2 = result.STARTS_BAROMETER * 25 / 35;
      const gem = (y1 + y2) / 2;
      if (gem < 10) {
         result.STATUS_BAROMETER = 'rood';
      } else if (gem < 20) {
         result.STATUS_BAROMETER = 'geel';
      } else {
         result.STATUS_BAROMETER = 'groen';
      }

      if (targetLid.INSTRUCTEUR) {
         result.STARTS_INSTRUCTIE = 0;
         const fromDate = new Date(peildatum);
         fromDate.setFullYear(fromDate.getFullYear() - 3);
         const instructieRows = await this.dbService.$queryRaw<SqlRow[]>(Prisma.sql`
            SELECT DUUR
            FROM startlijst_view
            WHERE DATUM > ${this.toSqlDate(fromDate)}
              AND DATUM <= ${this.toSqlDate(peildatum)}
              AND STARTTIJD IS NOT NULL
              AND LANDINGSTIJD IS NOT NULL
              AND INSTRUCTIEVLUCHT = 1
              AND INZITTENDE_ID = ${vliegerId}
         `);

         for (const flight of instructieRows) {
            result.STARTS_INSTRUCTIE += 1;
            urenInstructie += this.durationToMinutes(this.toStringValue(flight.DUUR));
         }
      }

      result.WAARDE = Math.floor(gem * 10) / 10;
      result.UREN_DRIE_MND = this.minutesToDuration(urenDrieMnd);
      result.UREN_24_MND = this.minutesToDuration(uren24Mnd);
      result.UREN_DIT_JAAR = this.minutesToDuration(urenDitJaar);
      result.UREN_VORIG_JAAR = this.minutesToDuration(urenVorigJaar);
      result.UREN_BAROMETER = this.minutesToDuration(urenBarometer);
      result.UREN_INSTRUCTIE = this.minutesToDuration(urenInstructie);

      return result;
   }

   private async buildLidLogboekWhere(
      user: RefLid,
      lidId: number,
      vliegtuigId?: number,
      jaar?: number,
      beginDatum?: Date,
      eindDatum?: Date,
      alleenAfgerond = false,
   ): Promise<Prisma.Sql>
   {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (alleenAfgerond) {
         conditions.push(Prisma.sql`STARTTIJD IS NOT NULL`, Prisma.sql`LANDINGSTIJD IS NOT NULL`);
      }

      if (lidId !== user.ID) {
         if (this.permissieService.isBeheerderDDWV(user)) {
            conditions.push(Prisma.sql`DDWV = 1`);
         } else if (!this.canViewOtherLogboeken(user)) {
            throw new HttpException('Gebruiker mag geen logboek van ander lid opvragen', HttpStatus.UNAUTHORIZED);
         }
      }

      if (this.permissieService.isInstructeur(user)) {
         conditions.push(Prisma.sql`((VLIEGER_ID = ${lidId}) OR ((INZITTENDE_ID = ${lidId}) AND INSTRUCTIEVLUCHT = 1))`);
      } else {
         conditions.push(Prisma.sql`((VLIEGER_ID = ${lidId}) OR (INZITTENDE_ID = ${lidId}))`);
      }

      if (vliegtuigId !== undefined) {
         conditions.push(Prisma.sql`VLIEGTUIG_ID = ${vliegtuigId}`);
      }
      if (jaar !== undefined) {
         const yearStart = `${jaar}-01-01`;
         const yearEnd = `${jaar}-12-31`;
         conditions.push(Prisma.sql`DATE(DATUM) >= ${yearStart}`, Prisma.sql`DATE(DATUM) <= ${yearEnd}`);
      }
      if (beginDatum) {
         conditions.push(Prisma.sql`DATE(DATUM) >= ${this.toSqlDate(beginDatum)}`);
      }
      if (eindDatum) {
         conditions.push(Prisma.sql`DATE(DATUM) <= ${this.toSqlDate(eindDatum)}`);
      }

      return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
   }

   private async hasStartlijstDataAccess(user: RefLid, datum?: string | null, instructeurs = true): Promise<boolean>
   {
      if (this.permissieService.isBeheerder(user) || (instructeurs && (this.permissieService.isInstructeur(user) || this.permissieService.isCIMT(user)))) {
         return true;
      }
      if (!datum) {
         return false;
      }
      if (this.permissieService.isStarttoren(user)) {
         return datum === this.toSqlDate(new Date());
      }
      if (this.permissieService.isBeheerderDDWV(user)) {
         return await this.isDdwvDay(datum);
      }
      if (this.permissieService.isDDWVCrew(user)) {
         return await this.isDdwvCrewDay(user, datum);
      }
      return false;
   }

   private buildVliegtuigWhere(vliegtuigId: number, beginDatum?: Date, eindDatum?: Date): Prisma.Sql
   {
      const conditions: Prisma.Sql[] = [
         Prisma.sql`STARTTIJD IS NOT NULL`,
         Prisma.sql`LANDINGSTIJD IS NOT NULL`,
         Prisma.sql`VLIEGTUIG_ID = ${vliegtuigId}`,
      ];

      if (beginDatum) {
         conditions.push(Prisma.sql`DATE(DATUM) >= ${this.toSqlDate(beginDatum)}`);
      }
      if (eindDatum) {
         conditions.push(Prisma.sql`DATE(DATUM) <= ${this.toSqlDate(eindDatum)}`);
      }
      if (!beginDatum && !eindDatum) {
         const yearStart = `${new Date().getFullYear()}-01-01`;
         conditions.push(Prisma.sql`DATUM >= ${yearStart}`);
      }

      return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
   }

   private buildLooseSortClause(sort: string | undefined, fallback: string): Prisma.Sql
   {
      const value = sort ?? fallback;
      const upperValue = value.toUpperCase();
      if (upperValue.includes('UPDATE') || upperValue.includes('DELETE') || value.includes(';')) {
         throw new HttpException('SORT is onjuist', HttpStatus.METHOD_NOT_ALLOWED);
      }
      if (!/^[A-Z0-9_, ()]+$/i.test(value)) {
         throw new HttpException('SORT is onjuist', HttpStatus.METHOD_NOT_ALLOWED);
      }
      return Prisma.raw(`ORDER BY ${value}`);
   }

   private buildSelectClause(fields: string | undefined): Prisma.Sql
   {
      const fieldMap = new Map<string, string>([
         ['ID', 'ID'],
         ['DATUM', 'DATUM'],
         ['DAGNUMMER', 'DAGNUMMER'],
         ['VLIEGTUIG_ID', 'VLIEGTUIG_ID'],
         ['STARTTIJD', 'CAST(STARTTIJD AS CHAR) AS STARTTIJD'],
         ['LANDINGSTIJD', 'CAST(LANDINGSTIJD AS CHAR) AS LANDINGSTIJD'],
         ['STARTMETHODE_ID', 'STARTMETHODE_ID'],
         ['VLIEGER_ID', 'VLIEGER_ID'],
         ['INZITTENDE_ID', 'INZITTENDE_ID'],
         ['VLIEGERNAAM', 'VLIEGERNAAM'],
         ['INZITTENDENAAM', 'INZITTENDENAAM'],
         ['SLEEPKIST_ID', 'SLEEPKIST_ID'],
         ['SLEEP_HOOGTE', 'SLEEP_HOOGTE'],
         ['VELD_ID', 'VELD_ID'],
         ['BAAN_ID', 'BAAN_ID'],
         ['OPMERKINGEN', 'OPMERKINGEN'],
         ['EXTERNAL_ID', 'EXTERNAL_ID'],
         ['PAX', 'PAX'],
         ['CHECKSTART', 'CHECKSTART'],
         ['INSTRUCTIEVLUCHT', 'INSTRUCTIEVLUCHT'],
         ['VERWIJDERD', 'VERWIJDERD'],
         ['LAATSTE_AANPASSING', 'LAATSTE_AANPASSING'],
         ['REGISTRATIE', 'REGISTRATIE'],
         ['CALLSIGN', 'CALLSIGN'],
         ['CLUBKIST', 'CLUBKIST'],
         ['SLEEPKIST', 'SLEEPKIST'],
         ['REG_CALL', 'REG_CALL'],
         ['DUUR', 'DUUR'],
         ['VLIEGERNAAM_LID', 'VLIEGERNAAM_LID'],
         ['INZITTENDENAAM_LID', 'INZITTENDENAAM_LID'],
         ['VLIEGTUIGTYPE', 'VLIEGTUIGTYPE'],
         ['VLIEGTUIG_TYPE_ID', 'VLIEGTUIG_TYPE_ID'],
         ['VLIEGER_LIDTYPE_ID', 'VLIEGER_LIDTYPE_ID'],
         ['INZITTENDE_LIDTYPE_ID', 'INZITTENDE_LIDTYPE_ID'],
         ['DDWV', 'DDWV'],
         ['STARTMETHODE', 'STARTMETHODE'],
         ['VELD', 'VELD'],
         ['BAAN', 'BAAN'],
      ]);

      const requested = !fields || fields.trim() === '*'
         ? Array.from(fieldMap.keys())
         : fields.toUpperCase().split(',').map((field) => field.trim()).filter(Boolean);

      if (fields?.toUpperCase().includes(';') || requested.some((field) => !fieldMap.has(field))) {
         throw new HttpException('VELDEN is onjuist', HttpStatus.METHOD_NOT_ALLOWED);
      }

      return Prisma.join(requested.map((field) => Prisma.raw(fieldMap.get(field))), ', ');
   }

   private async countRows(where: Prisma.Sql, useViewAlias = false): Promise<number>
   {
      const alias = useViewAlias ? Prisma.sql` slv` : Prisma.empty;
      const count = await this.dbService.$queryRaw<{totaal: bigint | number}[]>(Prisma.sql`
         SELECT COUNT(*) AS totaal
         FROM startlijst_view${alias}
         ${where}
      `);
      return Number(count[0]?.totaal ?? 0);
   }

   private async getLaatsteAanpassing(where: Prisma.Sql, useViewAlias = false): Promise<string | null>
   {
      const alias = useViewAlias ? Prisma.sql` slv` : Prisma.empty;
      const rows = await this.dbService.$queryRaw<{laatste_aanpassing: Date | string | null}[]>(Prisma.sql`
         SELECT MAX(LAATSTE_AANPASSING) AS laatste_aanpassing
         FROM startlijst_view${alias}
         ${where}
      `);
      return this.formatDateTimeValue(rows[0]?.laatste_aanpassing ?? null);
   }

   private async querySingleNumber(query: Prisma.Sql, key: string): Promise<number>
   {
      const rows = await this.dbService.$queryRaw<SqlRow[]>(query);
      return this.toNumberValue(rows[0]?.[key]);
   }

   private async querySingleDateTime(query: Prisma.Sql, key: string): Promise<string | null>
   {
      const rows = await this.dbService.$queryRaw<SqlRow[]>(query);
      return this.formatDateTimeValue(rows[0]?.[key]);
   }

   private buildSortClause(sort: string | undefined, allowedFields: string[]): Prisma.Sql
   {
      const value = sort ?? 'DATUM DESC, STARTTIJD DESC';
      const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
      const clauses = parts.map((part) => {
         const match = /^([A-Z_]+)(?:\s+(ASC|DESC))?$/i.exec(part);
         if (!match) {
            throw new HttpException('SORT is onjuist', HttpStatus.METHOD_NOT_ALLOWED);
         }

         const field = match[1].toUpperCase();
         const direction = (match[2] ?? 'ASC').toUpperCase();
         if (!allowedFields.includes(field)) {
            throw new HttpException('SORT is onjuist', HttpStatus.METHOD_NOT_ALLOWED);
         }
         return Prisma.raw(`\`${field}\` ${direction}`);
      });

      return Prisma.sql`ORDER BY ${Prisma.join(clauses, ', ')}`;
   }

   private buildLimitClause(start?: number, max?: number): Prisma.Sql
   {
      if (max === undefined || max === null || max <= 0) {
         return Prisma.empty;
      }

      const offset = start && start >= 0 ? start : 0;
      return Prisma.sql`LIMIT ${offset}, ${max}`;
   }

   private normalizeLogboekRow(row: GetLogboekRowResponse): GetLogboekRowResponse
   {
      return {
         ...row,
         DATUM: this.formatDateValue(row.DATUM),
         STARTTIJD: this.trimTime(row.STARTTIJD),
         LANDINGSTIJD: this.trimTime(row.LANDINGSTIJD),
         LAATSTE_AANPASSING: this.formatDateTimeValue(row.LAATSTE_AANPASSING),
      };
   }

   private normalizeStartlijstRecord(record: SqlRow): SqlRow
   {
      const normalized: SqlRow = {...record};
      const integerKeys = ['ID', 'DAGNUMMER', 'VLIEGTUIG_ID', 'STARTMETHODE_ID', 'VLIEGER_ID', 'INZITTENDE_ID', 'SLEEPKIST_ID', 'SLEEP_HOOGTE', 'VELD_ID', 'BAAN_ID', 'VLIEGER_LIDTYPE_ID', 'INZITTENDE_LIDTYPE_ID', 'VLIEGTUIG_TYPE_ID'];
      const booleanKeys = ['VERWIJDERD', 'CLUBKIST', 'DDWV', 'CHECKSTART', 'PAX', 'INSTRUCTIEVLUCHT'];

      for (const key of integerKeys) {
         if (normalized[key] !== undefined && normalized[key] !== null) {
            normalized[key] = this.toNumberValue(normalized[key]);
         }
      }
      for (const key of booleanKeys) {
         if (normalized[key] !== undefined && normalized[key] !== null) {
            normalized[key] = this.toBooleanValue(normalized[key]);
         }
      }
      if (normalized.DATUM !== undefined) {
         normalized.DATUM = this.formatDateValue(normalized.DATUM);
      }
      if (normalized.STARTTIJD !== undefined) {
         normalized.STARTTIJD = this.trimTime(normalized.STARTTIJD);
      }
      if (normalized.LANDINGSTIJD !== undefined) {
         normalized.LANDINGSTIJD = this.trimTime(normalized.LANDINGSTIJD);
      }
      if (normalized.LAATSTE_AANPASSING !== undefined) {
         normalized.LAATSTE_AANPASSING = this.formatDateTimeValue(normalized.LAATSTE_AANPASSING);
      }

      return normalized;
   }

   private async ensureAircraftLogboekAccess(user: RefLid, vliegtuigId: number): Promise<void>
   {
      if (this.hasAircraftLogboekPrivilege(user)) {
         return;
      }

      const vliegtuig = await this.dbService.refVliegtuig.findUnique({
         where: {ID: vliegtuigId},
         select: {CLUBKIST: true},
      });
      if (!vliegtuig) {
         throw new HttpException(`Vliegtuig record met ID ${vliegtuigId} niet gevonden`, HttpStatus.NOT_FOUND);
      }
      if (vliegtuig.CLUBKIST) {
         return;
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const count = await this.dbService.operStartlijst.count({
         where: {
            STARTTIJD: {not: null},
            VLIEGTUIG_ID: vliegtuigId,
            VLIEGER_ID: user.ID,
            DATUM: {gt: sixMonthsAgo},
         },
      });

      if (count === 0) {
         throw new HttpException('Niet gemachtigd om logboek te bekijken', HttpStatus.NOT_ACCEPTABLE);
      }
   }

   private hasAircraftLogboekPrivilege(user: RefLid): boolean
   {
      return this.permissieService.isBeheerder(user) ||
         this.permissieService.isBeheerderDDWV(user) ||
         this.permissieService.isStarttoren(user) ||
         this.permissieService.isRapporteur(user) ||
         this.permissieService.isInstructeur(user);
   }

   private canViewOtherLogboeken(user: RefLid): boolean
   {
      return this.permissieService.isBeheerder(user) ||
         this.permissieService.isRapporteur(user) ||
         this.permissieService.isStarttoren(user) ||
         this.permissieService.isInstructeur(user);
   }

   private requireVliegtuigId(id?: number): number
   {
      if (id === undefined || id === null) {
         throw new HttpException('ID ontbreekt in aanroep', HttpStatus.NOT_ACCEPTABLE);
      }
      return id;
   }

   private toSqlDate(value: Date): string
   {
      return value.toISOString().slice(0, 10);
   }

   private formatDateValue(value: unknown): string
   {
      if (value instanceof Date) {
         return value.toISOString().slice(0, 10);
      }
      return this.toStringValue(value);
   }

   private formatDateTimeValue(value: unknown): string | null
   {
      if (value === null || value === undefined) {
         return null;
      }
      if (value instanceof Date) {
         return value.toISOString();
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
         return `${value}`;
      }
      return JSON.stringify(value);
   }

   private trimTime(value: unknown): string | null
   {
      if (value === null || value === undefined) {
         return null;
      }
      const stringValue = this.toStringLikeValue(value);
      if (stringValue === null) {
         return null;
      }
      return stringValue.length >= 5 ? stringValue.slice(0, 5) : stringValue;
   }

   private toStringValue(value: unknown): string | null
   {
      return this.toStringLikeValue(value);
   }

   private toStringLikeValue(value: unknown): string | null
   {
      if (value === null || value === undefined) {
         return null;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
         return `${value}`;
      }
      if (value instanceof Date) {
         return value.toISOString();
      }
      return JSON.stringify(value);
   }

   private toNumberValue(value: unknown): number
   {
      if (typeof value === 'bigint') {
         return Number(value);
      }
      return Number(value ?? 0);
   }

   private toBooleanValue(value: unknown): boolean
   {
      return value === true || value === 1 || value === '1';
   }

   private durationToMinutes(value: string | null): number
   {
      if (!value) {
         return 0;
      }
      const parts = value.split(':').map(Number);
      return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
   }

   private minutesToDuration(minutes: number): string
   {
      const hours = Math.floor(minutes / 60);
      const restMinutes = minutes % 60;
      return `${hours}:${String(restMinutes).padStart(2, '0')}`;
   }

   private sumClockDurations(left: string, right: string): string
   {
      const leftParts = left.split(':').map(Number);
      const rightParts = right.split(':').map(Number);

      let seconds = (leftParts[2] ?? 0) + (rightParts[2] ?? 0);
      let minutes = (leftParts[1] ?? 0) + (rightParts[1] ?? 0);
      let hours = (leftParts[0] ?? 0) + (rightParts[0] ?? 0);

      if (seconds >= 60) {
         minutes += Math.floor(seconds / 60);
         seconds %= 60;
      }
      if (minutes >= 60) {
         hours += Math.floor(minutes / 60);
         minutes %= 60;
      }

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
   }

   private async isDdwvDay(datum: string): Promise<boolean>
   {
      const rooster = await this.dbService.operRooster.findFirst({
         where: {
            DATUM: new Date(datum),
            DDWV: true,
            VERWIJDERD: false,
         },
         select: {ID: true},
      });
      return rooster !== null;
   }

   private async isDdwvCrewDay(user: RefLid, datum: string): Promise<boolean>
   {
      const rooster = await this.isDdwvDay(datum);
      if (!rooster) {
         return false;
      }
      const diensten = await this.dbService.operDienst.count({
         where: {
            LID_ID: user.ID,
            DATUM: new Date(datum),
            VERWIJDERD: false,
         },
      });
      return diensten > 0;
   }
}