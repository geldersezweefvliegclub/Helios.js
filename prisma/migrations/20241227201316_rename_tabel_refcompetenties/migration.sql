/*
  Warnings:

  - You are about to drop the `RefCompetentie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `RefCompetentie` DROP FOREIGN KEY `RefCompetentie_LEERFASE_ID_fkey`;

-- DropForeignKey
ALTER TABLE `RefCompetentie` DROP FOREIGN KEY `RefCompetentie_OUDER_ID_fkey`;

-- DropTable
DROP TABLE `RefCompetentie`;

-- CreateTable
CREATE TABLE `ref_competenties` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `VOLGORDE` INTEGER NULL,
    `LEERFASE_ID` INTEGER NULL,
    `OUDER_ID` INTEGER NULL,
    `BLOK` VARCHAR(7) NULL,
    `OMSCHRIJVING` VARCHAR(75) NOT NULL,
    `DOCUMENTATIE` VARCHAR(75) NOT NULL,
    `GELDIGHEID` BOOLEAN NOT NULL DEFAULT false,
    `SCORE` BOOLEAN NOT NULL DEFAULT false,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ref_competenties` ADD CONSTRAINT `ref_competenties_LEERFASE_ID_fkey` FOREIGN KEY (`LEERFASE_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_competenties` ADD CONSTRAINT `ref_competenties_OUDER_ID_fkey` FOREIGN KEY (`OUDER_ID`) REFERENCES `ref_competenties`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;
