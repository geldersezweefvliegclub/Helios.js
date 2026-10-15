import { Injectable, Logger } from '@nestjs/common';
import { RefLid} from '@prisma/client';
import { LidType } from '../../core/enums/LidType';
import { Rol } from '../../core/enums/Rol';
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class PermissieService {
   private readonly logger = new Logger(PermissieService.name);

   heeftToegang(user: RefLid, functie:string): void
   {
      this.logger.verbose(`PermissieService.heeftToegang(${safeStringify({user, functie})})`);
      // controleer of de gebruiker de juiste rechten heeft
      // om toegang te krijgen tot de opgevraagde functie
      // TODO
   }

   // Overgangssituatie: een rol is actief als de (oude) boolean in ref_leden gezet is, of als de rol
   // voorkomt in ROLLEN_ID (ref_types met GROEP = TypesGroep.Rollen). Zodra de booleans uitgefaseerd zijn
   // vervalt het eerste deel van de controle
   isBeheerder(user: RefLid): boolean
   {
      const result = user.BEHEERDER || this.heeftRol(user, Rol.Beheerder);
      this.logger.verbose(`PermissieService.isBeheerder(${safeStringify({NAAM: user.NAAM, BEHEERDER: user.BEHEERDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isBeheerderDDWV(user: RefLid): boolean
   {
      const result = user.DDWV_BEHEERDER || this.heeftRol(user, Rol.DDWVBeheerder);
      this.logger.verbose(`PermissieService.isBeheerderDDWV(${safeStringify({NAAM: user.NAAM, DDWV_BEHEERDER: user.DDWV_BEHEERDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isInstructeur(user: RefLid): boolean
   {
      const result = user.INSTRUCTEUR || this.heeftRol(user, Rol.Instructeur);
      this.logger.verbose(`PermissieService.isInstructeur(${safeStringify({NAAM: user.NAAM, INSTRUCTEUR: user.INSTRUCTEUR, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isCIMT(user: RefLid): boolean
   {
      const result = user.CIMT || this.heeftRol(user, Rol.CIMT);
      this.logger.verbose(`PermissieService.isCIMT(${safeStringify({NAAM: user.NAAM, CIMT: user.CIMT, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isStarttoren(user: RefLid): boolean
   {
      const result = user.STARTTOREN || this.heeftRol(user, Rol.Starttoren);
      this.logger.verbose(`PermissieService.isStarttoren(${safeStringify({NAAM: user.NAAM, STARTTOREN: user.STARTTOREN, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isRooster(user: RefLid): boolean
   {
      const result = user.ROOSTER || this.heeftRol(user, Rol.Rooster);
      this.logger.verbose(`PermissieService.isRooster(${safeStringify({NAAM: user.NAAM, ROOSTER: user.ROOSTER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isRapporteur(user: RefLid): boolean
   {
      const result = user.RAPPORTEUR || this.heeftRol(user, Rol.Rapporteur);
      this.logger.verbose(`PermissieService.isRapporteur(${safeStringify({NAAM: user.NAAM, RAPPORTEUR: user.RAPPORTEUR, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isDDWVCrew(user: RefLid): boolean
   {
      const result = user.DDWV_CREW || this.heeftRol(user, Rol.DDWVCrew);
      this.logger.verbose(`PermissieService.isDDWVCrew(${safeStringify({NAAM: user.NAAM, DDWV_CREW: user.DDWV_CREW, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLierist(user: RefLid): boolean
   {
      const result = user.LIERIST || this.heeftRol(user, Rol.Lierist);
      this.logger.verbose(`PermissieService.isLierist(${safeStringify({NAAM: user.NAAM, LIERIST: user.LIERIST, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLIO(user: RefLid): boolean
   {
      const result = user.LIERIST_IO || this.heeftRol(user, Rol.LIO);
      this.logger.verbose(`PermissieService.isLIO(${safeStringify({NAAM: user.NAAM, LIERIST_IO: user.LIERIST_IO, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isStartleider(user: RefLid): boolean
   {
      const result = user.STARTLEIDER || this.heeftRol(user, Rol.Startleider);
      this.logger.verbose(`PermissieService.isStartleider(${safeStringify({NAAM: user.NAAM, STARTLEIDER: user.STARTLEIDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isTechnicus(user: RefLid): boolean
   {
      const result = user.TECHNICUS || this.heeftRol(user, Rol.Technicus);
      this.logger.verbose(`PermissieService.isTechnicus(${safeStringify({NAAM: user.NAAM, TECHNICUS: user.TECHNICUS, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isSleepvlieger(user: RefLid): boolean
   {
      const result = user.SLEEPVLIEGER || this.heeftRol(user, Rol.Sleepvlieger);
      this.logger.verbose(`PermissieService.isSleepvlieger(${safeStringify({NAAM: user.NAAM, SLEEPVLIEGER: user.SLEEPVLIEGER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isGastenvlieger(user: RefLid): boolean
   {
      const result = user.GASTENVLIEGER || this.heeftRol(user, Rol.Gastenvlieger);
      this.logger.verbose(`PermissieService.isGastenvlieger(${safeStringify({NAAM: user.NAAM, GASTENVLIEGER: user.GASTENVLIEGER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLid(user: RefLid): boolean
   {
      const result =
             user.LIDTYPE_ID === LidType.Erelid ||
             user.LIDTYPE_ID === LidType.Lid ||
             user.LIDTYPE_ID === LidType.Jeugdlid ||
             user.LIDTYPE_ID === LidType.Veteraan ||
             user.LIDTYPE_ID === LidType.PrivateOwner ||
             user.LIDTYPE_ID === LidType.Rittenkaart ||
             user.LIDTYPE_ID === LidType.Cursist ||
             user.LIDTYPE_ID === LidType.Donateur;
      this.logger.verbose(`PermissieService.isLid(${safeStringify({NAAM: user.NAAM, TYPE: user.LIDTYPE_ID, lid: result})})`);
      return result;
   }

   isDDWVer(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isDDWVer(${safeStringify({NAAM: user.NAAM, ddwv: user.LIDTYPE_ID === LidType.DDWV})})`);
      return user.LIDTYPE_ID === LidType.DDWV;
   }

   // zie isClubVlieger() in class.Leden.inc.php - anders dan isLid() hierboven telt Student hier ook mee
   isClubVlieger(user: RefLid): boolean
   {
      const result =
             user.LIDTYPE_ID === LidType.Student ||
             user.LIDTYPE_ID === LidType.Erelid ||
             user.LIDTYPE_ID === LidType.Lid ||
             user.LIDTYPE_ID === LidType.Jeugdlid ||
             user.LIDTYPE_ID === LidType.PrivateOwner ||
             user.LIDTYPE_ID === LidType.Veteraan ||
             user.LIDTYPE_ID === LidType.Donateur ||
             user.LIDTYPE_ID === LidType.Rittenkaart ||
             user.LIDTYPE_ID === LidType.Cursist;
      this.logger.verbose(`PermissieService.isClubVlieger(${safeStringify({NAAM: user.NAAM, TYPE: user.LIDTYPE_ID, clubVlieger: result})})`);
      return result;
   }

   isSysteemAccount(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isSysteemAccount(${safeStringify({NAAM: user.NAAM, systeemAccount: user.LIDTYPE_ID === LidType.SysteemAccount})})`);
      return user.LIDTYPE_ID === LidType.SysteemAccount;
   }

   ikBenHetZelf(user: RefLid, currentUser: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.ikBenHetZelf(${safeStringify({NAAM: user.NAAM, CURRENT_USER: currentUser.NAAM, result: user.ID === currentUser.ID})})`);
      return user.ID === currentUser.ID;
   }

   // controleer of de gebruiker privacy-instellingen heeft ingeschakeld
   // als de gebruiker een beheerder, beheerder DDWV, instructeur of CIMT is, zijn de privacy-instellingen niet van toepassing
   hasPrivacy(user: RefLid): boolean
   {
      if (this.isBeheerder(user) || this.isBeheerderDDWV(user) || this.isInstructeur(user) || this.isCIMT(user) || this.isStarttoren(user))
      {
         this.logger.verbose(`PermissieService.hasPrivacy(${safeStringify({NAAM: user.NAAM})}) = false, beheerder `);
         return false;
      }
      this.logger.verbose(`PermissieService.hasPrivacy(${safeStringify({NAAM: user.NAAM})}) => ${safeStringify(user.PRIVACY)}`);
      return user.PRIVACY;;
   }

   // controleer of de rol voorkomt in de comma-separated ROLLEN_ID lijst van het lid
   private heeftRol(user: RefLid, rol: Rol): boolean
   {
      return (user.ROLLEN_ID ?? "").split(",").filter(Boolean).map(Number).includes(rol);
   }
}
