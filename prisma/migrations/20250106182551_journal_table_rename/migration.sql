/*
  Warnings:

  - You are about to drop the `OperJournaal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `OperJournaal` DROP FOREIGN KEY `OperJournaal_AFGETEKEND_ID_fkey`;

-- DropForeignKey
ALTER TABLE `OperJournaal` DROP FOREIGN KEY `OperJournaal_MELDER_ID_fkey`;

-- DropForeignKey
ALTER TABLE `OperJournaal` DROP FOREIGN KEY `OperJournaal_STATUS_ID_fkey`;

-- DropForeignKey
ALTER TABLE `OperJournaal` DROP FOREIGN KEY `OperJournaal_TECHNICUS_ID_fkey`;

-- DropTable
DROP TABLE `OperJournaal`;

-- CreateTable
CREATE TABLE `oper_journaal` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `DATUM` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `VLIEGTUIG_ID` INTEGER NULL,
    `ROLLEND_ID` INTEGER NULL,
    `TITEL` VARCHAR(50) NOT NULL,
    `OMSCHRIJVING` TEXT NULL,
    `CATEGORIE_ID` INTEGER NULL,
    `STATUS_ID` INTEGER NULL,
    `MELDER_ID` INTEGER NULL,
    `TECHNICUS_ID` INTEGER NULL,
    `AFGETEKEND_ID` INTEGER NULL,
    `VERWIJDERD` INTEGER NOT NULL DEFAULT 0,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oper_journaal` ADD CONSTRAINT `oper_journaal_STATUS_ID_fkey` FOREIGN KEY (`STATUS_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oper_journaal` ADD CONSTRAINT `oper_journaal_MELDER_ID_fkey` FOREIGN KEY (`MELDER_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oper_journaal` ADD CONSTRAINT `oper_journaal_TECHNICUS_ID_fkey` FOREIGN KEY (`TECHNICUS_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oper_journaal` ADD CONSTRAINT `oper_journaal_AFGETEKEND_ID_fkey` FOREIGN KEY (`AFGETEKEND_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;
