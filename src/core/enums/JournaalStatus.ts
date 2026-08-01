// RefType records met GROEP = TypesGroep.MeldingenStatus (ref_types.GROEP = 25). De workflow doorloopt deze
// statussen in oplopende volgorde, zie het gebruik van {lte: ...} in vliegtuigen.service.ts.
export enum JournaalStatus
{
   Gemeld = 2501,
   Beoordeeld = 2502,
   InBehandeling = 2503,
   Uitgesteld = 2504,
   Opgelost = 2505,
   Afgetekend = 2506,
}
