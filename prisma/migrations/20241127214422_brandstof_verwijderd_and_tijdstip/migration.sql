/*
  Warnings:

  - You are about to drop the column `DATUM` on the `oper_brandstof` table. All the data in the column will be lost.
  - Added the required column `TIJDSTIP` to the `oper_brandstof` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oper_brandstof` DROP COLUMN `DATUM`,
    ADD COLUMN `TIJDSTIP` DATE NOT NULL,
    ADD COLUMN `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;
