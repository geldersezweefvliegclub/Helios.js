import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RefLid} from '@prisma/client';
import { LidType } from '../../core/enums/LidType';
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

   isBeheerder(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isBeheerder(${safeStringify({NAAM: user.NAAM, Beheerder: user.BEHEERDER})})`);
      return user.BEHEERDER;
   }

   isBeheerderDDWV(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isBeheerderDDWV(${safeStringify({NAAM: user.NAAM, Beheerder: user.DDWV_BEHEERDER})})`);
      return user.DDWV_BEHEERDER;
   }

   isInstructeur(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isInstructeur(${safeStringify({NAAM: user.NAAM, Instructeur: user.INSTRUCTEUR})})`);
      return user.INSTRUCTEUR;
   }

   isCIMT(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isCIMT(${safeStringify({NAAM: user.NAAM, CIMT: user.CIMT})})`);
      return user.CIMT;
   }

   isStarttoren(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isStarttoren(${safeStringify({NAAM: user.NAAM, Starttoren: user.STARTTOREN})})`);
      return user.STARTTOREN;
   }

   isRooster(user: RefLid) {
      this.logger.verbose(`PermissieService.isRooster(${safeStringify({NAAM: user.NAAM, ROOSTER: user.ROOSTER})})`);
      return user.ROOSTER;
   }

   isRapporteur(user: RefLid) {
      this.logger.verbose(`PermissieService.isRapporteur(${safeStringify({NAAM: user.NAAM, RAPPORTEUR: user.RAPPORTEUR})})`);
      return user.RAPPORTEUR;
   }

   isDDWVCrew(user: RefLid) {
      this.logger.verbose(`PermissieService.isDDWVCrew(${safeStringify({NAAM: user.NAAM, DDWV_CREW: user.DDWV_CREW})})`);
      return user.DDWV_CREW;
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
}
