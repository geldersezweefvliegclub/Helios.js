import {RefLid} from '@prisma/client';
import {PermissieService} from './permissie.service';
import {Rol} from '../../core/enums/Rol';

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
   const service = new PermissieService();

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
