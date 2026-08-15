// RefType records met GROEP = TypesGroep.DdwvStrippen (ref_types.GROEP = 20). De groep bevat een groot aantal
// tarief-regels die door een beheerder worden onderhouden; hier staan enkel de leden waar de source code op
// vertrouwt (zie de ddwv instellingen in configuration.ts).
export enum TransactieType
{
   UitschrijvenVoorVliegdag = 2004,
   UitschrijvenOpVliegdag = 2005,
   AnnulerenVliegdag = 2006,
   CrewVergoeding = 2007,
}
