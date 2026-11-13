import {maakLogFilter} from './LogHelper';

describe('maakLogFilter (IGNORE_LOGGING)', () =>
{
   it('laat alles door als IGNORE_LOGGING leeg of niet gezet is', () =>
   {
      expect(maakLogFilter(undefined)('AgendaService.GetObjects({})')).toBe(false);
      expect(maakLogFilter('  ')('AgendaService.GetObjects({})')).toBe(false);
   });

   it('Class.method matcht precies die functie, bij binnenkomst en bij het verlaten', () =>
   {
      const genegeerd = maakLogFilter('CompetentiesService.GetObjects');
      expect(genegeerd('CompetentiesService.GetObjects({"MAX":10})')).toBe(true);
      expect(genegeerd('CompetentiesService.GetObjects() => [...]')).toBe(true);
      expect(genegeerd('CompetentiesService.GetObject({"ID":1})')).toBe(false);
      expect(genegeerd('CompetentiesService.GetObjectsBoom({})')).toBe(false);
      expect(genegeerd('LedenService.GetObjects({})')).toBe(false);
   });

   it('Class zonder punt matcht elke functie van die class', () =>
   {
      const genegeerd = maakLogFilter('LedenService');
      expect(genegeerd('LedenService.GetObjects({})')).toBe(true);
      expect(genegeerd('LedenService.UpdateObject({})')).toBe(true);
      expect(genegeerd('LedenServiceExtra.GetObjects({})')).toBe(false);
      expect(genegeerd('LedenController.GetObjects({})')).toBe(false);
   });

   it('*.GetObjects matcht GetObjects van elke class, maar niet GetObject', () =>
   {
      const genegeerd = maakLogFilter('*.GetObjects');
      expect(genegeerd('AgendaService.GetObjects({})')).toBe(true);
      expect(genegeerd('TypesController.GetObjects() => {...}')).toBe(true);
      expect(genegeerd('AgendaService.GetObject({"ID":1})')).toBe(false);
      expect(genegeerd('AgendaService.UpdateObject({})')).toBe(false);
   });

   it('* werkt ook in een class- of functienaam', () =>
   {
      expect(maakLogFilter('Leden*')('LedenController.UpdateObject({})')).toBe(true);
      expect(maakLogFilter('Leden*')('AgendaService.GetObjects({})')).toBe(false);
      expect(maakLogFilter('*Service.Get*')('TypesService.GetObject({})')).toBe(true);
      expect(maakLogFilter('*Service.Get*')('TypesController.GetObject({})')).toBe(false);
   });

   it('combineert meerdere entries en negeert spaties', () =>
   {
      const genegeerd = maakLogFilter(' *.GetObjects , ProgressieController.ProgressieBoom ');
      expect(genegeerd('StartlijstService.GetObjects({})')).toBe(true);
      expect(genegeerd('ProgressieController.ProgressieBoom({})')).toBe(true);
      expect(genegeerd('ProgressieController.GetObject({})')).toBe(false);
   });

   it('matcht alleen aan het begin van de logregel', () =>
   {
      expect(maakLogFilter('*.GetObjects')('Fout in AgendaService.GetObjects()')).toBe(false);
   });
});
