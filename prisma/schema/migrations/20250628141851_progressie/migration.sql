/*
  Warnings:

  - You are about to drop the column `OPMERKING` on the `oper_progressie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `oper_progressie` DROP COLUMN `OPMERKING`,
    ADD COLUMN `OPMERKINGEN` TEXT NULL;
