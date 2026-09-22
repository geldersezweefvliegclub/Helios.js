-- Het gasten-registratie feature (module + oper_gasten tabel) is verwijderd uit de applicatie.
-- De FK-naam is een door Prisma afgeleide naam (het schema had geen expliciete map() voor deze relatie),
-- die mogelijk niet overeenkomt met de daadwerkelijke, legacy constraint-naam - vandaar IF EXISTS: DROP
-- TABLE verwijdert de foreign key toch, dus deze losse stap is puur voor duidelijkheid/consistentie met
-- hoe Prisma dit zelf zou genereren.
ALTER TABLE `oper_gasten` DROP FOREIGN KEY IF EXISTS `oper_gasten_VELD_ID_fkey`;
DROP TABLE IF EXISTS `oper_gasten`;
