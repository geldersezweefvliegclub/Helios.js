/*
  Warnings:

  - You are about to alter the column `PRIJS` on the `oper_brandstof` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.
  - You are about to alter the column `BEDRAG` on the `oper_brandstof` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.
  - You are about to alter the column `LITERS` on the `oper_brandstof` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.
  - You are about to alter the column `BEDRAG` on the `ref_types` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.
  - You are about to alter the column `EENHEDEN` on the `ref_types` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.

*/
-- AlterTable
ALTER TABLE `oper_brandstof` MODIFY `PRIJS` FLOAT NULL,
    MODIFY `BEDRAG` FLOAT NULL,
    MODIFY `LITERS` FLOAT NULL;

-- AlterTable
ALTER TABLE `oper_journaal` MODIFY `TITEL` VARCHAR(75) NOT NULL;

-- AlterTable
ALTER TABLE `ref_types` MODIFY `BEDRAG` FLOAT NULL,
    MODIFY `EENHEDEN` FLOAT NULL;

-- AlterTable
ALTER TABLE `ref_types_groepen` ADD COLUMN `BEDRAG_EENHEDEN` BOOLEAN NOT NULL DEFAULT false;
