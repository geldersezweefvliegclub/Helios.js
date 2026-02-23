/*
  Warnings:

  - You are about to alter the column `VERWIJDERD` on the `audit` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `LEGE_REGEL` on the `documenten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `ONDERSTREEP` on the `documenten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `BOVEN` on the `documenten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `documenten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VOORAANMELDING` on the `oper_aanwezig_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_aanwezig_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_aanwezig_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `OPENBAAR` on the `oper_agenda` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_agenda` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_brandstof` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `DDWV` on the `oper_daginfo` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CLUB_BEDRIJF` on the `oper_daginfo` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_daginfo` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_dagrapporten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `AANWEZIG` on the `oper_diensten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `UITBETAALD` on the `oper_diensten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `AFWEZIG` on the `oper_diensten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_diensten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_facturen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_gasten` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_journaal` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_progressie` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `IS_GEBOEKT` on the `oper_reservering` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_reservering` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `DDWV` on the `oper_rooster` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CLUB_BEDRIJF` on the `oper_rooster` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `WINTER_WERK` on the `oper_rooster` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_rooster` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `PAX` on the `oper_startlijst` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CHECKSTART` on the `oper_startlijst` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `INSTRUCTIEVLUCHT` on the `oper_startlijst` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_startlijst` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_tracks` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `DDWV` on the `oper_transacties` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `BETAALD` on the `oper_transacties` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_transacties` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `oper_winterwerk` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `GELDIGHEID` on the `ref_competenties` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `ref_competenties` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `LIERIST` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `LIERIST_IO` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `STARTLEIDER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `INSTRUCTEUR` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CIMT` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `DDWV_CREW` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `DDWV_BEHEERDER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `BEHEERDER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `STARTTOREN` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `ROOSTER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `SLEEPVLIEGER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `RAPPORTEUR` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `GASTENVLIEGER` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `TECHNICUS` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CLUBBLAD_POST` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `ZELFSTART_ABONNEMENT` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `AUTH` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `STARTVERBOD` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `OPGEZEGD` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `PRIVACY` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `EMAIL_DAGINFO` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `ref_leden` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `READ_ONLY` on the `ref_types` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `ref_types` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `READ_ONLY` on the `ref_types_groepen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `BEDRAG_EENHEDEN` on the `ref_types_groepen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `ref_types_groepen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `CLUBKIST` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `TMG` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `ZELFSTART` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `SLEEPKIST` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `INZETBAAR` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `TRAINER` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.
  - You are about to alter the column `VERWIJDERD` on the `ref_vliegtuigen` table. The data in that column could be lost. The data in that column will be cast from `UnsignedTinyInt` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `audit` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `documenten` MODIFY `LEGE_REGEL` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `ONDERSTREEP` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `BOVEN` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_aanwezig_leden` MODIFY `VOORAANMELDING` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_aanwezig_vliegtuigen` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_agenda` MODIFY `OPENBAAR` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_brandstof` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_daginfo` MODIFY `DDWV` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CLUB_BEDRIJF` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_dagrapporten` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_diensten` MODIFY `AANWEZIG` BOOLEAN NULL,
    MODIFY `UITBETAALD` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `AFWEZIG` BOOLEAN NULL,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_facturen` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_gasten` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_journaal` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_progressie` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_reservering` MODIFY `IS_GEBOEKT` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_rooster` MODIFY `DDWV` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CLUB_BEDRIJF` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `WINTER_WERK` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_startlijst` MODIFY `PAX` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CHECKSTART` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `INSTRUCTIEVLUCHT` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_tracks` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_transacties` MODIFY `DDWV` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `BETAALD` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `oper_winterwerk` MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_competenties` MODIFY `GELDIGHEID` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_leden` MODIFY `LIERIST` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `LIERIST_IO` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `STARTLEIDER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `INSTRUCTEUR` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CIMT` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `DDWV_CREW` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `DDWV_BEHEERDER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `BEHEERDER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `STARTTOREN` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `ROOSTER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `SLEEPVLIEGER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `RAPPORTEUR` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `GASTENVLIEGER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `TECHNICUS` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CLUBBLAD_POST` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `ZELFSTART_ABONNEMENT` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `AUTH` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `STARTVERBOD` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `OPGEZEGD` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `PRIVACY` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `EMAIL_DAGINFO` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_types` MODIFY `READ_ONLY` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_types_groepen` MODIFY `READ_ONLY` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `BEDRAG_EENHEDEN` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_vliegtuigen` MODIFY `CLUBKIST` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `TMG` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `ZELFSTART` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `SLEEPKIST` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `INZETBAAR` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `TRAINER` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `VERWIJDERD` BOOLEAN NOT NULL DEFAULT false;
