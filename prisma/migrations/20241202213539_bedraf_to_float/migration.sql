/*
  Warnings:

  - You are about to alter the column `BEDRAG` on the `ref_types` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Float`.

*/
-- AlterTable
ALTER TABLE `ref_types` MODIFY `BEDRAG` FLOAT NULL;
