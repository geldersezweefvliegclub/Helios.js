import {readdirSync, readFileSync, statSync} from 'fs';
import {join} from 'path';
import {Type} from '@nestjs/common';
import {PATH_METADATA} from '@nestjs/common/constants';
import {maakPermissieService} from './permissie.service.testhelper';

// alle *.controller.ts bestanden onder src/modules
function controllerBestanden(dir: string): string[]
{
   return readdirSync(dir).flatMap(naam =>
   {
      const pad = join(dir, naam);
      if (statSync(pad).isDirectory())
         return controllerBestanden(pad);
      return naam.endsWith('.controller.ts') ? [pad] : [];
   });
}

// elke functie die een controller aan heeftToegang() meegeeft moet een bestaand endpoint (of extra recht) zijn,
// anders kan er nooit een permissie voor worden ingevoerd en heeft alleen de beheerder toegang
describe('heeftToegang functies', () =>
{
   const bestanden = controllerBestanden(join(__dirname, '..'));

   it('bestaan allemaal in GetEndpoints()', async () =>
   {
      const modules = await Promise.all(bestanden.map(bestand => import(bestand) as Promise<Record<string, unknown>>));
      const controllers = modules
         .flatMap(module => Object.values(module))
         .filter((klasse): klasse is Type<unknown> => typeof klasse === 'function' && Reflect.getMetadata(PATH_METADATA, klasse) !== undefined);
      const {service} = await maakPermissieService([], controllers);
      const endpoints = service.GetEndpoints();

      const functies = bestanden.flatMap(bestand =>
         [...readFileSync(bestand, 'utf8').matchAll(/heeftToegang\(\s*currentUser\s*,\s*'([^']+)'/g)].map(match => match[1]));
      expect(functies.length).toBeGreaterThan(100);
      expect(functies.filter(functie => !endpoints.includes(functie))).toEqual([]);
   });
});
