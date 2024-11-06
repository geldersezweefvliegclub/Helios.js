/*
  Warnings:

  - Added the required column `REFRESH_TOKEN` to the `oper_login` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oper_login` ADD COLUMN `REFRESH_TOKEN` VARCHAR(191) NOT NULL;
