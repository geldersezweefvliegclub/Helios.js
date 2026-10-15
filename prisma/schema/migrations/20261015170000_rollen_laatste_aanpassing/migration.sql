-- De rollen (ref_types groep 27) en de typegroep Rollen zijn in 20261015120000_rollen_als_types en
-- 20261015150000_rol_iedereen toegevoegd zonder LAATSTE_AANPASSING. De kolom is NOT NULL zonder default (Prisma
-- @updatedAt), waardoor MariaDB er 0000-00-00 in heeft gezet. Prisma kan die waarde niet lezen, Types.GetObjects
-- gaf daardoor HTTP 400.
UPDATE `ref_types_groepen` SET `LAATSTE_AANPASSING` = NOW(3) WHERE `ID` = 27 AND CAST(`LAATSTE_AANPASSING` AS CHAR) LIKE '0000%';
UPDATE `ref_types` SET `LAATSTE_AANPASSING` = NOW(3) WHERE `GROEP` = 27 AND CAST(`LAATSTE_AANPASSING` AS CHAR) LIKE '0000%';
