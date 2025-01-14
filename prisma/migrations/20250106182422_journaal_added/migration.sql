-- CreateTable
CREATE TABLE `OperJournaal` (
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
ALTER TABLE `OperJournaal` ADD CONSTRAINT `OperJournaal_STATUS_ID_fkey` FOREIGN KEY (`STATUS_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperJournaal` ADD CONSTRAINT `OperJournaal_MELDER_ID_fkey` FOREIGN KEY (`MELDER_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperJournaal` ADD CONSTRAINT `OperJournaal_TECHNICUS_ID_fkey` FOREIGN KEY (`TECHNICUS_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperJournaal` ADD CONSTRAINT `OperJournaal_AFGETEKEND_ID_fkey` FOREIGN KEY (`AFGETEKEND_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;
