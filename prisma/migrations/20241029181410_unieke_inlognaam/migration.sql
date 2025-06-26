/*
  Warnings:

  - A unique constraint covering the columns `[INLOGNAAM]` on the table `ref_leden` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ref_leden_INLOGNAAM_key` ON `ref_leden`(`INLOGNAAM`);
