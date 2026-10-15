// RefType records met GROEP = TypesGroep.Rollen (ref_types.GROEP = 27). Dit zijn de vaste rollen waar de
// source code op vertrouwt; extra rollen kunnen via types worden toegevoegd zonder enum-uitbreiding.
// Een lid krijgt rollen via ref_leden.ROLLEN_ID (comma-separated lijst van deze ID's)
export enum Rol
{
   Beheerder = 2700,
   CIMT = 2701,
   Instructeur = 2702,
   Rapporteur = 2703,
   Lierist = 2704,
   LIO = 2705,
   DDWVCrew = 2706,
   DDWVBeheerder = 2707,
   Startleider = 2708,
   Technicus = 2709,
   Rooster = 2710,
   Starttoren = 2711,
   Sleepvlieger = 2712,
   Gastenvlieger = 2713,
   // impliciete rol: iedere ingelogde gebruiker heeft deze rol (zie PermissieService.heeftToegang), wordt niet
   // toegekend via ROLLEN_ID. Een permissie voor Iedereen geeft dus elke gebruiker toegang tot het endpoint
   Iedereen = 2750,
}

// Overgangssituatie: de boolean kolom in ref_leden die (nog) bij elke vaste rol hoort (behalve de impliciete rol
// Iedereen). Vervalt zodra de booleans uitgefaseerd zijn en ROLLEN_ID de enige bron is
export const RolKolom: Record<Exclude<Rol, Rol.Iedereen>, 'BEHEERDER' | 'CIMT' | 'INSTRUCTEUR' | 'RAPPORTEUR' | 'LIERIST' | 'LIERIST_IO' |
   'DDWV_CREW' | 'DDWV_BEHEERDER' | 'STARTLEIDER' | 'TECHNICUS' | 'ROOSTER' | 'STARTTOREN' | 'SLEEPVLIEGER' | 'GASTENVLIEGER'> =
{
   [Rol.Beheerder]: 'BEHEERDER',
   [Rol.CIMT]: 'CIMT',
   [Rol.Instructeur]: 'INSTRUCTEUR',
   [Rol.Rapporteur]: 'RAPPORTEUR',
   [Rol.Lierist]: 'LIERIST',
   [Rol.LIO]: 'LIERIST_IO',
   [Rol.DDWVCrew]: 'DDWV_CREW',
   [Rol.DDWVBeheerder]: 'DDWV_BEHEERDER',
   [Rol.Startleider]: 'STARTLEIDER',
   [Rol.Technicus]: 'TECHNICUS',
   [Rol.Rooster]: 'ROOSTER',
   [Rol.Starttoren]: 'STARTTOREN',
   [Rol.Sleepvlieger]: 'SLEEPVLIEGER',
   [Rol.Gastenvlieger]: 'GASTENVLIEGER',
};
