/*
  Warnings:

  - A unique constraint covering the columns `[LID_ID]` on the table `oper_login` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `oper_login_LID_ID_key` ON `oper_login`(`LID_ID`);
