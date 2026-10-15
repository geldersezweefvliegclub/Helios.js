-- Vervang de lidtype regels in ref_permissie door een regel voor de impliciete rol Iedereen (2750), maar alleen voor
-- endpoints waar ALLE (niet verwijderde) lidtypes uit de groep Lidmaatschap (6) toegang hebben. Endpoints waar maar
-- een deel van de lidtypes toegang heeft (bijv Diensten zonder DDWV vliegers, Reservering voor clubvliegers) blijven
-- ongewijzigd, Iedereen zou daar te veel toegang geven.

-- Iedereen regel voor elk endpoint waar alle lidtypes toegang hebben
INSERT IGNORE INTO `ref_permissie` (`ROL_ID`, `ENDPOINT`, `VERWIJDERD`, `LAATSTE_AANPASSING`)
SELECT 2750, p.`ENDPOINT`, 0, NOW(3)
FROM `ref_permissie` p
JOIN `ref_types` t ON t.`ID` = p.`ROL_ID` AND t.`GROEP` = 6 AND t.`VERWIJDERD` = 0
WHERE p.`VERWIJDERD` = 0
GROUP BY p.`ENDPOINT`
HAVING COUNT(DISTINCT p.`ROL_ID`) = (SELECT COUNT(*) FROM `ref_types` WHERE `GROEP` = 6 AND `VERWIJDERD` = 0);

-- de lidtype regels zijn voor die endpoints nu overbodig
DELETE p FROM `ref_permissie` p
JOIN `ref_types` t ON t.`ID` = p.`ROL_ID` AND t.`GROEP` = 6
JOIN `ref_permissie` i ON i.`ENDPOINT` = p.`ENDPOINT` AND i.`ROL_ID` = 2750 AND i.`VERWIJDERD` = 0;
