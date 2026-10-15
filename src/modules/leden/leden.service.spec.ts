import {HttpException, HttpStatus} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {EventEmitter2} from '@nestjs/event-emitter';
import {RefLid} from '@prisma/client';
import {LedenService} from './leden.service';
import {DbService} from '../../database/db-service/db.service';
import {ProgressieService} from '../progressie/progressie.service';
import {MqttService} from '../../core/services/mqtt.service';
import {maakPermissieService} from '../authorisatie/permissie.service.testhelper';
import {TypesService} from '../types/types.service';
import {Rol} from '../../core/enums/Rol';
import {TypesGroep} from '../../core/enums/TypesGroep';

describe('LedenService controle ROLLEN_ID', () =>
{
   const dbLid = {ID: 10, NAAM: 'Lid', LIDTYPE_ID: 602, LIDNR: '123'} as RefLid;
   const dbService = {
      refLid: {
         findUnique: jest.fn(async () => dbLid),
         findFirst: jest.fn(async () => null),
         create: jest.fn(async ({data}) => ({...dbLid, ...data})),
         update: jest.fn(async ({data}) => ({...dbLid, ...data})),
      },
   };
   // enkel de vaste rollen bestaan als type in de groep Rollen
   const typesService = {
      GetObjects: jest.fn(async (params: {IDs: number[], GROEP: number}) => ({
         dataset: params.IDs.filter(id => params.GROEP === TypesGroep.Rollen && id >= Rol.Beheerder && id <= Rol.Iedereen).map(ID => ({ID})),
      })),
   };
   let service: LedenService;
   beforeAll(async () => service = new LedenService(
      dbService as unknown as DbService,
      {emit: jest.fn()} as unknown as EventEmitter2,
      {} as ProgressieService,
      {} as MqttService,
      {} as ConfigService,
      (await maakPermissieService()).service,
      typesService as unknown as TypesService));
   const status = async (actie: Promise<unknown>) => actie.then(() => 200, (e: HttpException) => e.getStatus());

   beforeEach(() => jest.clearAllMocks());

   it('bestaande rollen worden opgeslagen', async () =>
   {
      expect(await status(service.UpdateObject(10, {ROLLEN_ID: `${Rol.Instructeur},${Rol.Startleider}`}, 1))).toBe(200);
      expect(dbService.refLid.update).toHaveBeenCalled();
   });

   it('onbekende rol geeft 400 bij UpdateObject en AddObject, er wordt niets opgeslagen', async () =>
   {
      expect(await status(service.UpdateObject(10, {ROLLEN_ID: `${Rol.Instructeur},999`}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(await status(service.AddObject({NAAM: 'Nieuw', LIDTYPE_ID: 602, ROLLEN_ID: '999'}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(dbService.refLid.update).not.toHaveBeenCalled();
      expect(dbService.refLid.create).not.toHaveBeenCalled();
   });

   it('de impliciete rol Iedereen kan niet worden toegekend', async () =>
   {
      expect(await status(service.UpdateObject(10, {ROLLEN_ID: `${Rol.Instructeur},${Rol.Iedereen}`}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(dbService.refLid.update).not.toHaveBeenCalled();
   });

   it('geen of lege ROLLEN_ID vraagt geen types op', async () =>
   {
      await service.UpdateObject(10, {WOONPLAATS: 'Teststad'}, 1);
      await service.UpdateObject(10, {ROLLEN_ID: null}, 1);
      expect(typesService.GetObjects).not.toHaveBeenCalled();
   });
});
