import { Injectable } from '@nestjs/common';
import { RefLid} from '@prisma/client';

@Injectable()
export class PermissieService {
   heeftToegang(user: RefLid, functie:string): void
   {
      // check if the user has the right permissions
      // to access the requested
      // TODO
      console.log(`User ${user} heeft toegang tot ${functie}`);
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
      return user.LIDTYPE_ID === 601 ||
             user.LIDTYPE_ID === 602 ||
             user.LIDTYPE_ID === 603 ||
             user.LIDTYPE_ID === 604 ||
             user.LIDTYPE_ID === 605 ||
             user.LIDTYPE_ID === 606;
   }

   isDDWVer(user: RefLid): boolean
   {
      return user.LIDTYPE_ID === 625;
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
