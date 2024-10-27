-- CreateTable
CREATE TABLE `Audit` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `DATUM` DATE NOT NULL,
    `LID_ID` INTEGER NOT NULL,
    `TABEL` VARCHAR(25) NULL,
    `TABEL_NAAM` VARCHAR(25) NULL,
    `ACTIE` VARCHAR(15) NULL,
    `OBJECT_ID` INTEGER NULL,
    `VOOR` TEXT NULL,
    `DATA` TEXT NULL,
    `RESULTAAT` TEXT NULL,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;