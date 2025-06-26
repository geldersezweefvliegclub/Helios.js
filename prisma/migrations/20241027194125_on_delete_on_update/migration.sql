-- DropForeignKey
ALTER TABLE `ref_leden` DROP FOREIGN KEY `ref_leden_BUDDY_ID2_fkey`;

-- DropForeignKey
ALTER TABLE `ref_leden` DROP FOREIGN KEY `ref_leden_BUDDY_ID_fkey`;

-- DropForeignKey
ALTER TABLE `ref_leden` DROP FOREIGN KEY `ref_leden_LIDTYPE_ID_fkey`;

-- DropForeignKey
ALTER TABLE `ref_leden` DROP FOREIGN KEY `ref_leden_STATUSTYPE_ID_fkey`;

-- DropForeignKey
ALTER TABLE `ref_leden` DROP FOREIGN KEY `ref_leden_ZUSTERCLUB_ID_fkey`;

-- DropForeignKey
ALTER TABLE `ref_types` DROP FOREIGN KEY `ref_types_TYPEGROEP_ID_fkey`;

-- AddForeignKey
ALTER TABLE `ref_leden` ADD CONSTRAINT `ref_leden_LIDTYPE_ID_fkey` FOREIGN KEY (`LIDTYPE_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_leden` ADD CONSTRAINT `ref_leden_STATUSTYPE_ID_fkey` FOREIGN KEY (`STATUSTYPE_ID`) REFERENCES `ref_types`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_leden` ADD CONSTRAINT `ref_leden_ZUSTERCLUB_ID_fkey` FOREIGN KEY (`ZUSTERCLUB_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_leden` ADD CONSTRAINT `ref_leden_BUDDY_ID_fkey` FOREIGN KEY (`BUDDY_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_leden` ADD CONSTRAINT `ref_leden_BUDDY_ID2_fkey` FOREIGN KEY (`BUDDY_ID2`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_types` ADD CONSTRAINT `ref_types_TYPEGROEP_ID_fkey` FOREIGN KEY (`TYPEGROEP_ID`) REFERENCES `ref_types_groepen`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;
