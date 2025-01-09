/*
  Warnings:

  - You are about to alter the column `VERWIJDERD` on the `oper_journaal` table. The data in that column could be lost. The data in that column will be cast from `Int` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `oper_journaal` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;
