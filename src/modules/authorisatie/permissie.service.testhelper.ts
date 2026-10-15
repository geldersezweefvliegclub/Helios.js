import {Type} from '@nestjs/common';
import {DiscoveryService, MetadataScanner, Reflector} from '@nestjs/core';
import {EventEmitter2} from '@nestjs/event-emitter';
import {RefPermissie} from '@prisma/client';
import {PermissieService} from './permissie.service';
import {DbService} from '../../database/db-service/db.service';
import {TypesService} from '../types/types.service';

// bouwt een PermissieService voor unit tests: ref_permissie en ref_types zijn in-memory mocks, de controllers
// (voor GetEndpoints) worden meegegeven als echte, gedecoreerde classes
export async function maakPermissieService(
   permissies: Partial<RefPermissie>[] = [],
   controllers: Type<unknown>[] = [],
   types: {ID: number, GROEP: number, VERWIJDERD?: boolean}[] = []): Promise<{service: PermissieService, tabel: RefPermissie[]}>
{
   let volgendId = 1;
   const tabel = permissies.map(p => ({ID: volgendId++, VERWIJDERD: false, LAATSTE_AANPASSING: new Date(), ...p}) as RefPermissie);
   const dbService = {
      refPermissie: {
         findMany: jest.fn(async ({where}) => tabel.filter(p => where?.VERWIJDERD === undefined || p.VERWIJDERD === where.VERWIJDERD)),
         findUnique: jest.fn(async ({where}) => tabel.find(p => p.ID === where.ID) ?? null),
         findFirst: jest.fn(async ({where}) => tabel.find(p => p.ROL_ID === where.ROL_ID && p.ENDPOINT === where.ENDPOINT && p.ID !== where.ID?.not) ?? null),
         create: jest.fn(async ({data}) =>
         {
            const obj = {ID: volgendId++, VERWIJDERD: false, LAATSTE_AANPASSING: new Date(), ...data} as RefPermissie;
            tabel.push(obj);
            return obj;
         }),
         update: jest.fn(async ({where, data}) => Object.assign(tabel.find(p => p.ID === where.ID), data)),
      },
   };
   const typesService = {
      GetObject: jest.fn(async (id: number) =>
      {
         const type = types.find(t => t.ID === id);
         if (!type)
            throw new Error('niet gevonden');
         return {VERWIJDERD: false, ...type};
      }),
   };
   const discoveryService = {
      getControllers: () => controllers.map(metatype => ({metatype, instance: Object.create(metatype.prototype)})),
   };

   const service = new PermissieService(
      dbService as unknown as DbService,
      {emit: jest.fn()} as unknown as EventEmitter2,
      discoveryService as unknown as DiscoveryService,
      new MetadataScanner(),
      new Reflector(),
      typesService as unknown as TypesService);
   await service.onApplicationBootstrap();
   return {service, tabel};
}
