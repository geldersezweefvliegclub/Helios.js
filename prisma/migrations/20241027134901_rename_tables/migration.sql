/*
  Warnings:

  - You are about to drop the `RefTypes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefTypesGroepen` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `RefTypes` DROP FOREIGN KEY `RefTypes_TYPEGROEP_ID_fkey`;

-- DropTable
DROP TABLE `RefTypes`;

-- DropTable
DROP TABLE `RefTypesGroepen`;

-- CreateTable
CREATE TABLE `ref_types` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `TYPEGROEP_ID` INTEGER NOT NULL,
    `CODE` VARCHAR(10) NULL,
    `EXT_REF` VARCHAR(25) NULL,
    `OMSCHRIJVING` VARCHAR(75) NOT NULL,
    `SORTEER_VOLGORDE` TINYINT NULL,
    `READ_ONLY` BOOLEAN NOT NULL DEFAULT false,
    `BEDRAG` DECIMAL(6, 2) NULL,
    `EENHEDEN` DECIMAL(6, 2) NULL,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TYPEGROEP_ID`(`TYPEGROEP_ID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_types_groepen` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `CODE` VARCHAR(10) NULL,
    `EXT_REF` VARCHAR(25) NULL,
    `OMSCHRIJVING` VARCHAR(75) NOT NULL,
    `SORTEER_VOLGORDE` SMALLINT NULL,
    `READ_ONLY` BOOLEAN NOT NULL DEFAULT false,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ref_types` ADD CONSTRAINT `ref_types_TYPEGROEP_ID_fkey` FOREIGN KEY (`TYPEGROEP_ID`) REFERENCES `ref_types_groepen`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;
