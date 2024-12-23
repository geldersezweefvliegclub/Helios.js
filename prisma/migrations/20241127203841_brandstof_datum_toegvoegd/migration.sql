/*
  Warnings:

  - Added the required column `DATUM` to the `oper_brandstof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oper_brandstof` ADD COLUMN `DATUM` DATE NOT NULL;
