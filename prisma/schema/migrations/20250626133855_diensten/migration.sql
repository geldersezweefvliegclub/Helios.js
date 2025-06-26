/*
  Warnings:

  - Added the required column `LID_ID` to the `oper_diensten` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `oper_diensten` ADD COLUMN `LID_ID` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `oper_diensten` ADD CONSTRAINT `oper_diensten_LID_ID_fkey` FOREIGN KEY (`LID_ID`) REFERENCES `ref_leden`(`ID`) ON DELETE NO ACTION ON UPDATE CASCADE;
