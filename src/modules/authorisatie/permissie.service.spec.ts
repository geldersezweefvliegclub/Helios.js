import {Controller, Get, HttpException, HttpStatus, Put} from '@nestjs/common';
import {RefLid} from '@prisma/client';
import {PermissieService} from './permissie.service';
import {maakPermissieService} from './permissie.service.testhelper';
import {Rol} from '../../core/enums/Rol';
import {LidType} from '../../core/enums/LidType';
import {TypesGroep} from '../../core/enums/TypesGroep';

// minimaal lid voor de rol-controles: alle booleans uit, geen ROLLEN_ID
const maakLid = (velden: Partial<RefLid> = {}): RefLid => ({
   ID: 1, NAAM: 'Test',
   BEHEERDER: false, CIMT: false, INSTRUCTEUR: false, RAPPORTEUR: false, LIERIST: false, LIERIST_IO: false,
   DDWV_CREW: false, DDWV_BEHEERDER: false, STARTLEIDER: false, TECHNICUS: false, ROOSTER: false,
   STARTTOREN: false, SLEEPVLIEGER: false, GASTENVLIEGER: false, ROLLEN_ID: null,
   ...velden,
} as RefLid);

describe('PermissieService rollen (overgangssituatie)', () =>
{
   let service: PermissieService;
   beforeAll(async () => ({service} = await maakPermissieService()));

   it('boolean gezet geeft true', () =>
   {
      expect(service.isInstructeur(maakLid({INSTRUCTEUR: true}))).toBe(true);
   });

   it('boolean niet gezet maar rol in ROLLEN_ID geeft true', () =>
   {
      expect(service.isInstructeur(maakLid({ROLLEN_ID: `${Rol.CIMT},${Rol.Instructeur}`}))).toBe(true);
   });

   it('boolean niet gezet en rol niet in ROLLEN_ID geeft false', () =>
   {
      expect(service.isInstructeur(maakLid({ROLLEN_ID: `${Rol.CIMT}`}))).toBe(false);
      expect(service.isInstructeur(maakLid())).toBe(false);
   });

   it('elke isX functie kijkt naar zijn eigen rol in ROLLEN_ID', () =>
   {
      const controles: [keyof PermissieService, Rol][] = [
         ['isBeheerder', Rol.Beheerder], ['isBeheerderDDWV', Rol.DDWVBeheerder], ['isInstructeur', Rol.Instructeur],
         ['isCIMT', Rol.CIMT], ['isStarttoren', Rol.Starttoren], ['isRooster', Rol.Rooster],
         ['isRapporteur', Rol.Rapporteur], ['isDDWVCrew', Rol.DDWVCrew], ['isLierist', Rol.Lierist],
         ['isLIO', Rol.LIO], ['isStartleider', Rol.Startleider], ['isTechnicus', Rol.Technicus],
         ['isSleepvlieger', Rol.Sleepvlieger], ['isGastenvlieger', Rol.Gastenvlieger],
      ];
      for (const [functie, rol] of controles)
      {
         const isX = (service[functie] as (user: RefLid) => boolean).bind(service);
         expect(isX(maakLid({ROLLEN_ID: `${rol}`}))).toBe(true);
         expect(isX(maakLid({ROLLEN_ID: `${rol === Rol.Beheerder ? Rol.CIMT : Rol.Beheerder}`}))).toBe(false);
      }
   });
});

describe('PermissieService ref_permissie', () =>
{
   @Controller('Leden')
   class LedenTestController
   {
      @Get('GetObjects') GetObjects() { return; }
      @Put('SaveObject') UpdateObject() { return; }
      hulpfunctie() { return; } // geen endpoint
   }
   @Controller('Types')
   class TypesTestController
   {
      @Get('GetObjects') GetObjects() { return; }
   }
   const controllers = [LedenTestController, TypesTestController];
   const types = [
      {ID: Rol.Instructeur, GROEP: TypesGroep.Rollen},
      {ID: Rol.Iedereen, GROEP: TypesGroep.Rollen},
      {ID: LidType.Lid, GROEP: TypesGroep.Lidmaatschap},
      {ID: 401, GROEP: TypesGroep.VliegtuigTypes},
   ];
   const status = async (actie: Promise<unknown>) => actie.then(() => 200, (e: HttpException) => e.getStatus());
   const toegang = (service: PermissieService, user: RefLid, functie: string) =>
   {
      try { service.heeftToegang(user, functie); return true; }
      catch { return false; }
   };

   it('GetEndpoints geeft de routes, de extra rechten en per module een wildcard', async () =>
   {
      const {service} = await maakPermissieService([], controllers);
      expect(service.GetEndpoints()).toEqual([
         'Diensten.*', 'Diensten.AddObject.AndersLid',
         'Leden.*', 'Leden.GetObjects', 'Leden.UpdateObject',
         'Types.*', 'Types.GetObjects',
      ]);
   });

   it('beheerder heeft altijd toegang, ook zonder permissies', async () =>
   {
      const {service} = await maakPermissieService();
      expect(toegang(service, maakLid({BEHEERDER: true}), 'Leden.UpdateObject')).toBe(true);
      expect(toegang(service, maakLid({ROLLEN_ID: `${Rol.Beheerder}`}), 'Leden.UpdateObject')).toBe(true);
   });

   it('endpoint zonder permissie is geweigerd', async () =>
   {
      const {service} = await maakPermissieService([{ROL_ID: Rol.Instructeur, ENDPOINT: 'Types.GetObjects'}]);
      expect(toegang(service, maakLid({INSTRUCTEUR: true}), 'Leden.GetObjects')).toBe(false);
   });

   it('rol via ROLLEN_ID, via de oude boolean en via het lidtype geeft toegang', async () =>
   {
      const {service} = await maakPermissieService([
         {ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.GetObjects'},
         {ROL_ID: LidType.Lid, ENDPOINT: 'Types.GetObjects'},
      ]);
      expect(toegang(service, maakLid({ROLLEN_ID: `${Rol.Instructeur}`}), 'Leden.GetObjects')).toBe(true);
      expect(toegang(service, maakLid({INSTRUCTEUR: true}), 'Leden.GetObjects')).toBe(true);
      expect(toegang(service, maakLid({LIDTYPE_ID: LidType.Lid}), 'Types.GetObjects')).toBe(true);
      expect(toegang(service, maakLid({LIDTYPE_ID: LidType.Lid}), 'Leden.GetObjects')).toBe(false);
   });

   it('wildcard Leden.* geeft toegang tot alle endpoints van Leden, niet tot andere modules', async () =>
   {
      const {service} = await maakPermissieService([{ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.*'}]);
      const instructeur = maakLid({INSTRUCTEUR: true});
      expect(toegang(service, instructeur, 'Leden.UpdateObject')).toBe(true);
      expect(toegang(service, instructeur, 'Leden.GetObjects')).toBe(true);
      expect(toegang(service, instructeur, 'Types.GetObjects')).toBe(false);
   });

   it('permissie voor de impliciete rol Iedereen geeft elke gebruiker toegang', async () =>
   {
      const {service} = await maakPermissieService([{ROL_ID: Rol.Iedereen, ENDPOINT: 'Types.GetObjects'}]);
      expect(toegang(service, maakLid(), 'Types.GetObjects')).toBe(true);
      expect(toegang(service, maakLid({LIDTYPE_ID: LidType.DDWV}), 'Types.GetObjects')).toBe(true);
      expect(toegang(service, maakLid(), 'Leden.GetObjects')).toBe(false);
   });

   it('verwijderde permissie geeft geen toegang', async () =>
   {
      const {service} = await maakPermissieService([{ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.*', VERWIJDERD: true}]);
      expect(toegang(service, maakLid({INSTRUCTEUR: true}), 'Leden.GetObjects')).toBe(false);
   });

   it('na AddObject, DeleteObject en RestoreObject wordt de cache bijgewerkt', async () =>
   {
      const {service} = await maakPermissieService([], controllers, types);
      const instructeur = maakLid({INSTRUCTEUR: true});
      expect(toegang(service, instructeur, 'Leden.GetObjects')).toBe(false);

      const obj = await service.AddObject({ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.GetObjects'}, 1);
      expect(toegang(service, instructeur, 'Leden.GetObjects')).toBe(true);

      await service.UpdateObject(obj.ID, {VERWIJDERD: true}, 1);
      expect(toegang(service, instructeur, 'Leden.GetObjects')).toBe(false);

      await service.UpdateObject(obj.ID, {VERWIJDERD: false}, 1);
      expect(toegang(service, instructeur, 'Leden.GetObjects')).toBe(true);
   });

   it('validatie: onbekend endpoint en verkeerde rol geven 400, dubbele permissie geeft 409', async () =>
   {
      const {service} = await maakPermissieService([{ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.*'}], controllers, types);
      expect(await status(service.AddObject({ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.Bestaatniet'}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(await status(service.AddObject({ROL_ID: Rol.Instructeur, ENDPOINT: '*'}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(await status(service.AddObject({ROL_ID: 401, ENDPOINT: 'Leden.GetObjects'}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(await status(service.AddObject({ROL_ID: 9999, ENDPOINT: 'Leden.GetObjects'}, 1))).toBe(HttpStatus.BAD_REQUEST);
      expect(await status(service.AddObject({ROL_ID: Rol.Instructeur, ENDPOINT: 'Leden.*'}, 1))).toBe(HttpStatus.CONFLICT);
      expect(await status(service.AddObject({ROL_ID: LidType.Lid, ENDPOINT: 'Types.*'}, 1))).toBe(200);
      expect(await status(service.AddObject({ROL_ID: Rol.Iedereen, ENDPOINT: 'Leden.GetObjects'}, 1))).toBe(200);
   });
});
