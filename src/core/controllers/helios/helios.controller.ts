import {Controller, HttpException, HttpStatus} from '@nestjs/common';

@Controller('helios')
export class HeliosController {
   async DeletePreconditions(service: any, id: number){
      const obj =  await service.GetObject(id);
      if (!obj)
         throw new HttpException(`Record with ID ${id} not found`, HttpStatus.NOT_FOUND);

      if (obj.VERWIJDERD)
         throw new HttpException(`Record with ID ${id} already deleted`, HttpStatus.CONFLICT);
   }
}
