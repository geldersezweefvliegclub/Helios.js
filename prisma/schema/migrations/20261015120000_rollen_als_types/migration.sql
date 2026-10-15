-- Rollen worden dynamisch: in plaats van vaste booleans per rol op ref_leden komen de rollen als records in
-- ref_types (groep 27 "Rollen") en krijgt een lid zijn rollen via ROLLEN_ID (comma-separated lijst van type ID's).
-- Nieuwe rollen kunnen daarna zonder codewijziging via Types worden toegevoegd. De vaste rollen hieronder zijn
-- READ_ONLY omdat de source code er via de Rol enum (src/core/enums/Rol.ts) naar verwijst. CODE is maximaal 10
-- tekens en dus te kort voor de kolomnamen; de oude kolomnaam staat daarom in EXT_REF.
-- De booleans blijven in de overgangssituatie bestaan; PermissieService.isX() kijkt naar de boolean of ROLLEN_ID.

-- AlterTable
ALTER TABLE `ref_leden` ADD COLUMN `ROLLEN_ID` VARCHAR(250) NULL;

-- Typegroep Rollen
INSERT IGNORE INTO `ref_types_groepen` (`ID`, `CODE`, `EXT_REF`, `OMSCHRIJVING`, `SORTEER_VOLGORDE`, `READ_ONLY`, `BEDRAG_EENHEDEN`, `VERWIJDERD`)
VALUES (27, NULL, NULL, 'Rollen', NULL, 0, 0, 0);

-- Vaste rollen, zie de Rol enum
INSERT IGNORE INTO `ref_types` (`ID`, `GROEP`, `CODE`, `EXT_REF`, `OMSCHRIJVING`, `SORTEER_VOLGORDE`, `READ_ONLY`, `BEDRAG`, `EENHEDEN`, `VERWIJDERD`)
VALUES
    (2700, 27, NULL, 'BEHEERDER',      'Beheerder',      0, 1, NULL, NULL, 0),
    (2701, 27, NULL, 'CIMT',           'CIMT',           1, 1, NULL, NULL, 0),
    (2702, 27, NULL, 'INSTRUCTEUR',    'Instructeur',    2, 1, NULL, NULL, 0),
    (2703, 27, NULL, 'RAPPORTEUR',     'Rapporteur',     3, 1, NULL, NULL, 0),
    (2704, 27, NULL, 'LIERIST',        'Lierist',        4, 1, NULL, NULL, 0),
    (2705, 27, NULL, 'LIERIST_IO',     'LIO',            5, 1, NULL, NULL, 0),
    (2706, 27, NULL, 'DDWV_CREW',      'DDWV-Crew',      6, 1, NULL, NULL, 0),
    (2707, 27, NULL, 'DDWV_BEHEERDER', 'DDWV Beheerder', 7, 1, NULL, NULL, 0),
    (2708, 27, NULL, 'STARTLEIDER',    'Startleider',    8, 1, NULL, NULL, 0),
    (2709, 27, NULL, 'TECHNICUS',      'Technicus',      9, 1, NULL, NULL, 0),
    (2710, 27, NULL, 'ROOSTER',        'Rooster',       10, 1, NULL, NULL, 0),
    (2711, 27, NULL, 'STARTTOREN',     'Starttoren',    11, 1, NULL, NULL, 0),
    (2712, 27, NULL, 'SLEEPVLIEGER',   'Sleepvlieger',  12, 1, NULL, NULL, 0),
    (2713, 27, NULL, 'GASTENVLIEGER',  'Gastenvlieger', 13, 1, NULL, NULL, 0);

-- ROLLEN_ID vullen vanuit de bestaande booleans, zonder LAATSTE_AANPASSING te wijzigen
UPDATE `ref_leden` SET `ROLLEN_ID` = NULLIF(CONCAT_WS(',',
    IF(`BEHEERDER`,      '2700', NULL),
    IF(`CIMT`,           '2701', NULL),
    IF(`INSTRUCTEUR`,    '2702', NULL),
    IF(`RAPPORTEUR`,     '2703', NULL),
    IF(`LIERIST`,        '2704', NULL),
    IF(`LIERIST_IO`,     '2705', NULL),
    IF(`DDWV_CREW`,      '2706', NULL),
    IF(`DDWV_BEHEERDER`, '2707', NULL),
    IF(`STARTLEIDER`,    '2708', NULL),
    IF(`TECHNICUS`,      '2709', NULL),
    IF(`ROOSTER`,        '2710', NULL),
    IF(`STARTTOREN`,     '2711', NULL),
    IF(`SLEEPVLIEGER`,   '2712', NULL),
    IF(`GASTENVLIEGER`,  '2713', NULL)), ''),
    `LAATSTE_AANPASSING` = `LAATSTE_AANPASSING`
WHERE `ID` > 0;
