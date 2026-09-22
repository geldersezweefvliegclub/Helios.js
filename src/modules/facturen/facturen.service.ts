import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {MqttService} from "../../core/services/mqtt.service";

import {Prisma, OperFactuur} from "@prisma/client";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {NogTeFacturerenResponse} from "./NogTeFacturerenResponse";
import {FactuurBericht} from "./FactuurBericht";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";
import {LidType} from "../../core/enums/LidType";
import {TypesGroep} from "../../core/enums/TypesGroep";
import {LedenService} from "../leden/leden.service";
import {GetObjectsRefLedenRequest} from "../leden/GetObjectsRefLedenRequest";
import {TypesService} from "../types/types.service";
import {GetObjectsRefTypesRequest} from "../types/GetObjectsRefTypesRequest";

// LIDTYPE_ID's waarvoor contributie gefactureerd wordt - alle lidmaatschapstypes behalve Erelid,
// zie AanmakenFacturen()/NogTeFactureren() in class.Facturen.inc.php (hardcoded als 600,602,603,604,605,606)
const CONTRIBUTIE_LIDTYPES: LidType[] =
   [LidType.Student, LidType.Lid, LidType.Jeugdlid, LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur];

@Injectable()
export class FacturenService extends IHeliosService
{
   private readonly logger = new Logger(FacturenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly mqttService: MqttService,
               private readonly ledenService: LedenService,
               private readonly typesService: TypesService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operFactuur.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Factuur record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`FacturenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.logger.verbose(`FacturenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperFacturenRequest, {VERWIJDERD: false});
      const where: Prisma.OperFactuurWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: { in: params.LID_ID }},
                  { JAAR: params.JAAR },
                  {
                     OR: [
                        { NAAM:           { contains: params.SELECTIE }},
                        { FACTUUR_NUMMER: { contains: params.SELECTIE }},
                        { OMSCHRIJVING:   { contains: params.SELECTIE }},
                        { LIDNR:          { contains: params.SELECTIE }}
                     ]
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operFactuur.count({where: where});
      }
      const objs = await this.dbService.operFactuur.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperFactuurOrderByWithRelationInput>(params.SORT ?? "ID"),
         take: params.MAX,
         skip: params.START});
      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`FacturenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperFactuurUncheckedCreateInput, actorId: number): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.AddObject(${safeStringify({data})})`);
      // NAAM is niet door de client instelbaar (@DtoReadOnly), wordt altijd afgeleid van het gekoppelde lid
      data.NAAM = await this.lidNaam(data.LID_ID as number);

      const obj = await this.dbService.operFactuur.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`FacturenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperFactuurUncheckedUpdateInput, actorId: number): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      // een reeds geuploade factuur (FACTUUR_NUMMER gezet) mag niet meer verwijderd worden
      if (data.VERWIJDERD === true && db.FACTUUR_NUMMER)
         throw new HttpException(`Factuur is reeds geupload`, HttpStatus.METHOD_NOT_ALLOWED);

      // NAAM is niet door de client instelbaar (@DtoReadOnly) - enkel opnieuw afleiden als LID_ID
      // onderdeel is van deze update (gekoppeld lid wijzigt), anders blijft de bestaande NAAM staan
      if (data.LID_ID !== undefined)
         data.NAAM = data.LID_ID === null ? null : await this.lidNaam(data.LID_ID as number);

      const obj = await this.dbService.operFactuur.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`FacturenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`FacturenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operFactuur.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // leden zonder factuur voor het opgegeven jaar, enkel lidmaatschapstypes die contributie moeten betalen
   async NogTeFactureren(jaar: number, hash?: string): Promise<IHeliosGetObjectsResponse<NogTeFacturerenResponse>>
   {
      this.logger.verbose(`FacturenService.NogTeFactureren(${safeStringify({jaar})})`);
      const peildatum = new Date(jaar, 0, 1);

      // Welke leden hebben dit jaar al een factuur?
      const factuurLidIds = await this.dbService.operFactuur.findMany({
         where: {JAAR: jaar},
         select: {LID_ID: true}
      });
      const heeftAlFactuur = new Set(factuurLidIds.map((f) => f.LID_ID));

      // Leden die contributie moeten betalen (alle lidmaatschapstypes behalve Erelid) - zie CONTRIBUTIE_LIDTYPES hierboven.
      const kandidaten = await this.ledenService.GetObjects(MaakGetObjectsRequest(GetObjectsRefLedenRequest, {
         VERWIJDERD: false,
         TYPES: CONTRIBUTIE_LIDTYPES,
      }));

      // Contributiebedragen via TypesService
      const lidmaatschapTypes = await this.typesService.GetObjects(MaakGetObjectsRequest(GetObjectsRefTypesRequest, {
         GROEP: TypesGroep.Lidmaatschap,
         VERWIJDERD: false
      }));
      const lidmaatschapPerType = new Map(lidmaatschapTypes.dataset.map((type) => [type.ID, type]));

      const dataset = kandidaten.dataset
         .filter((lid) => !heeftAlFactuur.has(lid.ID))
         .map((lid) =>
         {
            const lidmaatschap = lidmaatschapPerType.get(lid.LIDTYPE_ID);
            return {
               ...lid,
               // dezelfde maskering als in LedenController - secrets horen nooit in een response
               SECRET: null,
               WACHTWOORD: null,
               LEEFTIJD: this.berekenLeeftijd(lid.GEBOORTE_DATUM, peildatum),
               LIDMAATSCHAP: lidmaatschap?.OMSCHRIJVING ?? null,
               CONTRIBUTIE: lidmaatschap?.BEDRAG ?? null,
            } as NogTeFacturerenResponse;
         });

      const result = this.buildGetObjectsResponse(dataset, dataset.length, hash);
      this.logger.verbose(`FacturenService.NogTeFactureren() => ${safeStringify(result)}`);
      return result;
   }

   // maakt voor elk opgegeven lid een contributiefactuur aan op basis van hun lidmaatschapstype - zie
   // AanmakenFacturen() in class.Facturen.inc.php
   async AanmakenFacturen(jaar: number, lidIds: number[], actorId: number): Promise<OperFactuur[]>
   {
      this.logger.verbose(`FacturenService.AanmakenFacturen(${safeStringify({jaar, lidIds})})`);

      const lidmaatschapTypes = await this.typesService.GetObjects(MaakGetObjectsRequest(GetObjectsRefTypesRequest, {
         GROEP: TypesGroep.Lidmaatschap,
         VERWIJDERD: false
      }));
      const lidmaatschapPerType = new Map(lidmaatschapTypes.dataset.map((type) => [type.ID, type]));

      const resultaat: OperFactuur[] = [];
      for (const lidId of lidIds)
      {
         // eigen tabel bevragen mag niet voor ref_leden - dat is de tabel van LedenService
         const lid = await this.ledenService.GetObject(lidId);

         const lidmaatschap = lidmaatschapPerType.get(lid.LIDTYPE_ID);
         if (!lidmaatschap)
            throw new HttpException(`Lidtype ${lid.NAAM} niet gevonden`, HttpStatus.NOT_FOUND);

         if (lidmaatschap.BEDRAG == null)
            throw new HttpException(`Bedrag voor lidtype ${lidmaatschap.OMSCHRIJVING} niet ingevuld`, HttpStatus.NOT_FOUND);

         const factuur = await this.AddObject({
            JAAR: jaar,
            LID_ID: lidId,
            LIDNR: lid.LIDNR,
            CODE: lidmaatschap.EXT_REF,
            OMSCHRIJVING: `Lidmaatschap ${jaar} - ${lidmaatschap.OMSCHRIJVING}`,
            GEFACTUREERD: lidmaatschap.BEDRAG,
         }, actorId);
         resultaat.push(factuur);
      }
      this.logger.verbose(`FacturenService.AanmakenFacturen() => ${safeStringify(resultaat)}`);
      return resultaat;
   }

   // Publiceert een MQTT bericht met de factuurgegevens voor een bestaande factuur -
   async UploadFactuur(id: number): Promise<void>
   {
      this.logger.verbose(`FacturenService.UploadFactuur(${safeStringify({id})})`);
      const dbFactuur = await this.GetObject(id);

      const bericht: FactuurBericht = {
         FACTUUR_ID: dbFactuur.ID,
         LID_ID: dbFactuur.LID_ID,
         LIDNR: dbFactuur.LIDNR,
         NAAM: dbFactuur.NAAM,
         JAAR: dbFactuur.JAAR,
         DATUM: toDateOnly(new Date()),
         OMSCHRIJVING: dbFactuur.OMSCHRIJVING,
         REGELS: [{
            TRANSACTIE_ID: null,
            CODE: dbFactuur.CODE,
            OMSCHRIJVING: dbFactuur.OMSCHRIJVING,
            AANTAL: 1,
            BEDRAG_PER_EENHEID: Number(dbFactuur.GEFACTUREERD),
         }],
      };

      await this.publiceerFactuurBericht('oper_facturen', bericht);
      this.logger.verbose(`FacturenService.UploadFactuur() => gepubliceerd`);
   }

   // publiceert een MQTT bericht met de factuurgegevens voor de niet-gefactureerde DDWV-transacties van
   // een lid op een vliegdag
   async UploadTransactieFactuur(lidId: number, datum: Date): Promise<void>
   {
      this.logger.verbose(`FacturenService.UploadTransactieFactuur(${safeStringify({lidId, datum})})`);

      const transacties = await this.dbService.operTransactie.findMany({
         where: {LID_ID: lidId, VLIEGDAG: datum, VERWIJDERD: false},
         include: {TypeTransactie: true}
      });
      if (transacties.length === 0)
         throw new HttpException(`Geen transacties gevonden`, HttpStatus.NOT_FOUND);

      const lid = await this.ledenService.GetObject(lidId);
      const teFactureren = transacties.filter((transactie) => transactie.BEDRAG != null && transactie.EXT_REF == null);
      if (teFactureren.length === 0)
         throw new HttpException(`Geen transacties gevonden`, HttpStatus.NOT_FOUND);

      const vliegdag = toDateOnly(datum);
      const bericht: FactuurBericht = {
         FACTUUR_ID: null,
         LID_ID: lidId,
         LIDNR: lid.LIDNR,
         NAAM: lid.NAAM,
         JAAR: null,
         DATUM: vliegdag,
         OMSCHRIJVING: `DDWV ${vliegdag}`,
         REGELS: teFactureren.map((transactie) =>
         {
            const aantal = transactie.EENHEDEN && transactie.EENHEDEN > 0 ? transactie.EENHEDEN : 1;
            return {
               TRANSACTIE_ID: transactie.ID,
               CODE: transactie.TypeTransactie.EXT_REF,
               OMSCHRIJVING: transactie.DDWV ? transactie.TypeTransactie.OMSCHRIJVING : transactie.OMSCHRIJVING,
               AANTAL: aantal,
               BEDRAG_PER_EENHEID: Number(transactie.BEDRAG) / aantal,
            };
         }),
      };

      await this.publiceerFactuurBericht('oper_transacties', bericht);
      this.logger.verbose(`FacturenService.UploadTransactieFactuur() => gepubliceerd`);
   }


   private async lidNaam(lidId: number): Promise<string | null>
   {
      this.logger.verbose(`FacturenService.lidNaam(${safeStringify({lidId})})`);
      const lid = await this.ledenService.GetObject(lidId);
      const result = lid.NAAM;
      this.logger.verbose(`FacturenService.lidNaam() => ${safeStringify(result)}`);
      return result;
   }

   // leeftijd van een lid op een peildatum (bijv. 1 januari van het factuurjaar)
   private berekenLeeftijd(geboorteDatum: Date | null, peildatum: Date): number | null
   {
      if (!geboorteDatum) return null;
      let leeftijd = peildatum.getFullYear() - geboorteDatum.getFullYear();
      const verjaardagGehad = (peildatum.getMonth() > geboorteDatum.getMonth()) ||
         (peildatum.getMonth() === geboorteDatum.getMonth() && peildatum.getDate() >= geboorteDatum.getDate());
      if (!verjaardagGehad)
         leeftijd--;
      return leeftijd;
   }

   // publiceert het FactuurBericht op de MQTT bus - vertaalt een publish-fout (bijv. mqtt_settings
   // ontbreekt, of de broker is onbereikbaar) naar een dezelfde X-Error-Message afhandeling als de rest
   // van de applicatie, in plaats van de generieke 500 die MqttService's eigen Error anders zou opleveren
   private async publiceerFactuurBericht(table: string, bericht: FactuurBericht): Promise<void>
   {
      try
      {
         await this.mqttService.publish('helios', 'factuur_upload', table, bericht);
      }
      catch (err)
      {
         const foutmelding = err instanceof Error ? err.message : String(err);
         this.logger.error(`FacturenService.publiceerFactuurBericht: ${foutmelding}`);
         throw new HttpException(`Factuurbericht kon niet gepubliceerd worden: ${foutmelding}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }
}
