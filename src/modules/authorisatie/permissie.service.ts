import { Injectable, Logger } from '@nestjs/common';
import { RefLid} from '@prisma/client';
import { LidType } from '../../core/enums/LidType';

@Injectable()
export class PermissieService {
   private readonly logger = new Logger(PermissieService.name);

   heeftToegang(user: RefLid, functie:string): void
   {
      // check if the user has the right permissions
      // to access the requested
      // TODO
      this.logger.verbose("User " + user.VOORNAAM + " " + user.ACHTERNAAM + " has access to " + functie);
   }

   isBeheerder(user: RefLid): boolean
   {
      return user.BEHEERDER;
   }

   isBeheerderDDWV(user: RefLid): boolean
   {
      return user.DDWV_BEHEERDER;
   }

   isInstructeur(user: RefLid): boolean
   {
      return user.INSTRUCTEUR;
   }

   isCIMT(user: RefLid): boolean
   {
      return user.CIMT;
   }

   isStarttoren(user: RefLid): boolean
   {
      return user.STARTTOREN;
   }

   isLid(user: RefLid): boolean
   {
      return user.LIDTYPE_ID === LidType.Erelid ||
             user.LIDTYPE_ID === LidType.Lid ||
             user.LIDTYPE_ID === LidType.Jeugdlid ||
             user.LIDTYPE_ID === LidType.PrivateOwner ||
             user.LIDTYPE_ID === LidType.Veteraan ||
             user.LIDTYPE_ID === LidType.Donateur;
   }

   isDDWVer(user: RefLid): boolean
   {
      return user.LIDTYPE_ID === LidType.DDWV;
   }

   // check if the user has privacy settings enabled
   // if the user is a beheerder, beheerder DDWV, instructeur or CIMT, the privacy settings are ignored
   hasPrivacy(user: RefLid): boolean
   {
      if (this.isBeheerder(user) || this.isBeheerderDDWV(user) || this.isInstructeur(user) || this.isCIMT(user) || this.isStarttoren(user))
      {
         return false;
      }
      return user.PRIVACY;
   }

   isRooster(currentUser: RefLid) {
      return currentUser.ROOSTER
   }

    isRapporteur(currentUser: RefLid) {
       return currentUser.RAPPORTEUR;
    }

    isDDWVCrew(currentUser: RefLid) {
       return currentUser.DDWV_CREW;
    }
}
