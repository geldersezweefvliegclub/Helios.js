/*
  Warnings:

  - You are about to drop the column `AANVANG` on the `oper_aanwezig_leden` table. All the data in the column will be lost.
  - Added the required column `AANKOMST` to the `oper_aanwezig_leden` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oper_aanwezig_leden` DROP COLUMN `AANVANG`,
    ADD COLUMN `AANKOMST` TIME NOT NULL;
