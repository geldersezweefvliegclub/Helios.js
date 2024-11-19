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
      return user.BEHEERDER ?? false;
   }

   isBeheerderDDWV(user: RefLid): boolean
   {
      return user.DDWV_BEHEERDER ?? false;
   }

   isInstructeur(user: RefLid): boolean
   {
      return user.INSTRUCTEUR ?? false;
   }

   isCIMT(user: RefLid): boolean
   {
      return user.CIMT ?? false;
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
}
