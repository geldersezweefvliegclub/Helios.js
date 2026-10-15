-- Impliciete rol Iedereen: elke ingelogde gebruiker heeft deze rol (zie PermissieService.heeftToegang), hij wordt
-- niet via ref_leden.ROLLEN_ID toegekend. Een regel in ref_permissie voor rol 2750 geeft dus iedereen toegang tot
-- dat endpoint. READ_ONLY omdat de source code er via de Rol enum (src/core/enums/Rol.ts) naar verwijst.
INSERT IGNORE INTO `ref_types` (`ID`, `GROEP`, `CODE`, `EXT_REF`, `OMSCHRIJVING`, `SORTEER_VOLGORDE`, `READ_ONLY`, `BEDRAG`, `EENHEDEN`, `VERWIJDERD`)
VALUES (2750, 27, NULL, NULL, 'Iedereen', 14, 1, NULL, NULL, 0);
