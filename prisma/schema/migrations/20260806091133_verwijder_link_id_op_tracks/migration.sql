-- LINK_ID werd enkel intern gebruikt door de oude UpdateObject audit-trail-aanpak (nieuw record + link naar
-- het origineel). Die aanpak is vervangen door een gewone in-place update, waardoor LINK_ID geen functie meer heeft.
-- 169 bestaande koppelingen gaan hierdoor verloren; de TEKST van beide betrokken rijen blijft behouden.
ALTER TABLE `oper_tracks` DROP FOREIGN KEY `oper_tracks_ibfk_4`;
DROP INDEX `LINK_ID` ON `oper_tracks`;
ALTER TABLE `oper_tracks` DROP COLUMN `LINK_ID`;
