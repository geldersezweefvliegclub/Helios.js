/*
  Warnings:

  - You are about to drop the column `ROLLENMATERIEEL` on the `oper_dagrapporten` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `oper_dagrapporten` DROP COLUMN `ROLLENMATERIEEL`,
    ADD COLUMN `ROLLENDMATERIEEL` VARCHAR(191) NULL;
