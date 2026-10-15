-- Rechten per rol: elke regel geeft een rol (type uit de groep Rollen, of een lidtype) toegang tot een endpoint
-- van de applicatie (bijv Leden.UpdateObject) of tot alle endpoints van een module (bijv Leden.*). Wordt gebruikt
-- door PermissieService.heeftToegang(); een endpoint zonder regels is alleen toegankelijk voor de beheerder.
-- Er worden bewust geen regels ingevoerd, die worden door de beheerder via Permissie/SaveObject beheerd.

-- CreateTable
CREATE TABLE `ref_permissie` (
    `ID` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ROL_ID` MEDIUMINT UNSIGNED NOT NULL,
    `ENDPOINT` VARCHAR(100) NOT NULL,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL,

    INDEX `VERWIJDERD`(`VERWIJDERD`),
    UNIQUE INDEX `ROL_ENDPOINT`(`ROL_ID`, `ENDPOINT`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ref_permissie` ADD CONSTRAINT `ref_permissie_ibfk_1` FOREIGN KEY (`ROL_ID`) REFERENCES `ref_types`(`ID`) ON DELETE RESTRICT ON UPDATE RESTRICT;
