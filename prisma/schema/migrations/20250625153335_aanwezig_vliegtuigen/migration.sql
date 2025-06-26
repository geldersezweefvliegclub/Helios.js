-- CreateTable
CREATE TABLE `oper_aanwezig_vliegtuigen` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `DATUM` DATE NOT NULL,
    `VELD_ID` INTEGER NULL,
    `AANKOMST` TIME NULL,
    `VERTREK` TIME NULL,
    `VLIEGTUIG_ID` INTEGER NOT NULL,
    `LATITUDE` DOUBLE NULL,
    `LONGITUDE` DOUBLE NULL,
    `HOOGTE` DOUBLE NULL,
    `SNELHEID` DOUBLE NULL,
    `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false,
    `LAATSTE_AANPASSING` DATETIME(3) NOT NULL,

    INDEX `oper_aanwezig_vliegtuigen_VERWIJDERD_idx`(`VERWIJDERD`),
    INDEX `oper_aanwezig_vliegtuigen_DATUM_idx`(`DATUM`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Audit_VERWIJDERD_idx` ON `Audit`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `documenten_VERWIJDERD_idx` ON `documenten`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_aanwezig_leden_VERWIJDERD_idx` ON `oper_aanwezig_leden`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_agenda_VERWIJDERD_idx` ON `oper_agenda`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_brandstof_VERWIJDERD_idx` ON `oper_brandstof`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_brandstof_TIJDSTIP_idx` ON `oper_brandstof`(`TIJDSTIP`);

-- CreateIndex
CREATE INDEX `oper_daginfo_VERWIJDERD_idx` ON `oper_daginfo`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_daginfo_DATUM_idx` ON `oper_daginfo`(`DATUM`);

-- CreateIndex
CREATE INDEX `oper_dagrapporten_VERWIJDERD_idx` ON `oper_dagrapporten`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_gasten_VERWIJDERD_idx` ON `oper_gasten`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_journaal_VERWIJDERD_idx` ON `oper_journaal`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_journaal_DATUM_idx` ON `oper_journaal`(`DATUM`);

-- CreateIndex
CREATE INDEX `oper_transacties_VERWIJDERD_idx` ON `oper_transacties`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `oper_transacties_VLIEGDAG_idx` ON `oper_transacties`(`VLIEGDAG`);

-- CreateIndex
CREATE INDEX `oper_winterwerk_VERWIJDERD_idx` ON `oper_winterwerk`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `ref_types_VERWIJDERD_idx` ON `ref_types`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `ref_types_groepen_VERWIJDERD_idx` ON `ref_types_groepen`(`VERWIJDERD`);

-- CreateIndex
CREATE INDEX `ref_vliegtuigen_VERWIJDERD_idx` ON `ref_vliegtuigen`(`VERWIJDERD`);

-- AddForeignKey
ALTER TABLE `oper_aanwezig_vliegtuigen` ADD CONSTRAINT `oper_aanwezig_vliegtuigen_VELD_ID_fkey` FOREIGN KEY (`VELD_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oper_aanwezig_vliegtuigen` ADD CONSTRAINT `oper_aanwezig_vliegtuigen_VLIEGTUIG_ID_fkey` FOREIGN KEY (`VLIEGTUIG_ID`) REFERENCES `ref_vliegtuigen`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `oper_aanwezig_leden_DATUM_idx` ON `oper_aanwezig_leden`(`DATUM`);
DROP INDEX `DATUM` ON `oper_aanwezig_leden`;

-- RedefineIndex
CREATE INDEX `oper_agenda_DATUM_idx` ON `oper_agenda`(`DATUM`);
DROP INDEX `DATUM` ON `oper_agenda`;

-- RedefineIndex
CREATE INDEX `oper_dagrapporten_DATUM_idx` ON `oper_dagrapporten`(`DATUM`);
DROP INDEX `DATUM` ON `oper_dagrapporten`;

-- RedefineIndex
CREATE INDEX `oper_gasten_DATUM_idx` ON `oper_gasten`(`DATUM`);
DROP INDEX `DATUM_IDX` ON `oper_gasten`;

-- RedefineIndex
CREATE INDEX `oper_winterwerk_DATUM_idx` ON `oper_winterwerk`(`DATUM`);
DROP INDEX `DATUM` ON `oper_winterwerk`;

-- RedefineIndex
CREATE INDEX `ref_types_TYPEGROEP_ID_idx` ON `ref_types`(`TYPEGROEP_ID`);
DROP INDEX `TYPEGROEP_ID` ON `ref_types`;
