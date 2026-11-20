-- Daginfo.GetObjects stond al open voor Iedereen (2750), Daginfo.GetObject niet. Pegasus vraagt op elk scherm
-- Daginfo/GetObject?DATUM=<vandaag> op, waardoor een gewoon lid op elk scherm een 401 kreeg.
INSERT IGNORE INTO `ref_permissie` (`ROL_ID`, `ENDPOINT`, `VERWIJDERD`, `LAATSTE_AANPASSING`)
VALUES (2750, 'Daginfo.GetObject', 0, NOW(3));
