import {HttpException, HttpStatus} from "@nestjs/common";

// werpt een HttpException als de request body leeg is (bv. ontbrekende Content-Type header bij de client),
// in plaats van een cryptische TypeError te geven zodra de controller een veld van data uitleest
export function bodyHeeftData(data: unknown): void
{
   if (!data) {
      throw new HttpException(`Geen data ontvangen in de request body`, HttpStatus.BAD_REQUEST);
   }

   if (Object.keys(data).length === 0) {
      throw new HttpException(`Lege data ontvangen in de request body`, HttpStatus.BAD_REQUEST);
   }
}
