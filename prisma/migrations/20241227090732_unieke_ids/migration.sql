/*
  Warnings:

  - A unique constraint covering the columns `[LIDNR]` on the table `ref_leden` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[REGISTRATIE]` on the table `ref_vliegtuigen` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ref_leden_LIDNR_key` ON `ref_leden`(`LIDNR`);

-- CreateIndex
CREATE UNIQUE INDEX `ref_vliegtuigen_REGISTRATIE_key` ON `ref_vliegtuigen`(`REGISTRATIE`);
