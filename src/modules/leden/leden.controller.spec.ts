import {HttpException, HttpStatus} from '@nestjs/common';
import {RefLid} from '@prisma/client';
import {LedenController} from './leden.controller';
import {LedenService} from './leden.service';
import {maakPermissieService} from '../authorisatie/permissie.service.testhelper';
import {Rol} from '../../core/enums/Rol';
import {UpdateRefLidDto} from '../../generated/nestjs-dto/update-refLid.dto';
import {plainToInstance} from 'class-transformer';
import {validate} from 'class-validator';

const maakLid = (velden: Partial<RefLid> = {}): RefLid => ({
   ID: 10, NAAM: 'Lid', LIDTYPE_ID: 602,
   BEHEERDER: false, CIMT: false, INSTRUCTEUR: false, RAPPORTEUR: false, LIERIST: false, LIERIST_IO: false,
   DDWV_CREW: false, DDWV_BEHEERDER: false, STARTLEIDER: false, TECHNICUS: false, ROOSTER: false,
   STARTTOREN: false, SLEEPVLIEGER: false, GASTENVLIEGER: false, ROLLEN_ID: null, PRIVACY: false,
   ...velden,
} as RefLid);

describe('LedenController rollen (ROLLEN_ID)', () =>
{
   let dbLid: RefLid;
   let opgeslagen: Record<string, unknown>;
   let controller: LedenController;
   const ledenService = {
      GetObject: jest.fn(async () => dbLid),
      UpdateObject: jest.fn(async (_id: number, data: Record<string, unknown>) => { opgeslagen = data; return {...dbLid, ...data}; }),
      SyncLeden: jest.fn(async () => undefined),
   };

   const beheerder = maakLid({ID: 1, BEHEERDER: true, ROLLEN_ID: `${Rol.Beheerder}`});
   const rooster = maakLid({ID: 2, ROLLEN_ID: `${Rol.Rooster}`});
   const update = (currentUser: RefLid, data: Partial<UpdateRefLidDto>) =>
      controller.UpdateObject(currentUser, dbLid.ID, {ID: dbLid.ID, ...data} as UpdateRefLidDto);
   const status = async (actie: Promise<unknown>) => actie.then(() => 200, (e: HttpException) => e.getStatus());

   beforeEach(async () =>
   {
      dbLid = maakLid();
      opgeslagen = {};
      // de roostermaker mag Leden endpoints gebruiken, de beheerder heeft altijd toegang
      const {service} = await maakPermissieService([{ROL_ID: Rol.Rooster, ENDPOINT: 'Leden.*'}]);
      controller = new LedenController(ledenService as unknown as LedenService, service);
   });

   it('beheerder slaat ROLLEN_ID op en de booleans volgen', async () =>
   {
      await update(beheerder, {ROLLEN_ID: `${Rol.Instructeur},${Rol.Startleider}`});
      expect(opgeslagen.ROLLEN_ID).toBe(`${Rol.Instructeur},${Rol.Startleider}`);
      expect(opgeslagen.INSTRUCTEUR).toBe(true);
      expect(opgeslagen.STARTLEIDER).toBe(true);
      expect(opgeslagen.AUTH).toBe(true); // instructeur vereist 2FA
   });

   it('niet-beheerder met een onbekend rol-ID geeft 401 (alleen beheerder mag niet-vaste rollen wijzigen)', async () =>
   {
      expect(await status(update(rooster, {ROLLEN_ID: '999'}))).toBe(HttpStatus.UNAUTHORIZED);
   });

   it('DTO weigert ROLLEN_ID met andere tekens dan cijfers en komma\'s', async () =>
   {
      const fouten = (rollenId: string) => validate(plainToInstance(UpdateRefLidDto, {ROLLEN_ID: rollenId}));
      expect(await fouten('abc')).not.toHaveLength(0);
      expect(await fouten('2702; 2708')).not.toHaveLength(0);
      expect(await fouten('2702,2708')).toHaveLength(0);
      expect(await fouten('')).toHaveLength(0);
   });

   it('rooster mag startleider toekennen, maar geen instructeur', async () =>
   {
      expect(await status(update(rooster, {ROLLEN_ID: `${Rol.Startleider}`}))).toBe(200);
      expect(await status(update(rooster, {ROLLEN_ID: `${Rol.Instructeur}`}))).toBe(HttpStatus.UNAUTHORIZED);
   });

   it('rol intrekken via ROLLEN_ID zet de boolean op false', async () =>
   {
      dbLid = maakLid({INSTRUCTEUR: true, STARTLEIDER: true, ROLLEN_ID: `${Rol.Instructeur},${Rol.Startleider}`});
      await update(beheerder, {ROLLEN_ID: `${Rol.Startleider}`});
      expect(opgeslagen.ROLLEN_ID).toBe(`${Rol.Startleider}`);
      expect(opgeslagen.INSTRUCTEUR).toBe(false);
   });

   it('oude client: boolean uitzetten haalt de rol uit ROLLEN_ID', async () =>
   {
      dbLid = maakLid({INSTRUCTEUR: true, ROLLEN_ID: `${Rol.Instructeur}`});
      await update(beheerder, {INSTRUCTEUR: false, ROLLEN_ID: `${Rol.Instructeur}`});
      expect(opgeslagen.ROLLEN_ID).toBeNull();
      expect(opgeslagen.INSTRUCTEUR).toBe(false);
   });

   it('beheerder kan de rol beheerder niet bij zichzelf intrekken', async () =>
   {
      dbLid = beheerder;
      expect(await status(update(beheerder, {ROLLEN_ID: ''}))).toBe(HttpStatus.UNAUTHORIZED);
   });
});
