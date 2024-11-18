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
}
