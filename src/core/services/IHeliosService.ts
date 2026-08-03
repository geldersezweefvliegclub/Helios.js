import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsResponse";
import {crc32} from "js-crc";
import {HttpException, HttpStatus} from "@nestjs/common";

export abstract class IHeliosService
{
   // Het output formaat van de GetObjects call
   protected buildGetObjectsResponse<Type>(objects: Type[], count = undefined, hash: string = undefined): IHeliosGetObjectsResponse<Type>
   {
      const response = {
         dataset: objects,
         totaal: count ? count : objects.length,      // als count niet is opgegeven, geef de lengte van de array terug
         hash: crc32(JSON.stringify(objects))
      } as IHeliosGetObjectsResponse<Type>

      if ((response.hash === hash) && (hash !== undefined)) {
         throw new HttpException("Data is ongewijzigd", HttpStatus.NOT_MODIFIED);
      }

      return response;
   }

   // Zet een string zoals "field1 asc, field2 desc" om naar een array van objects zoals [{field1: "asc"}, {field2: "desc"}]
   // Dit wordt gebruikt in de sort functie van prisma
   protected SortStringToSortObj<oType>(sort: string): oType[]
   {
      const retVal: oType[] = [];
      if (!sort) return undefined;

      sort.split(',').forEach(part =>  // splits op komma
      {
         const [field, order] = part.trim().split(' ');

         if (part.includes('.')) {
            const [table, child_field] = field.split('.');
            const sortObj = {} as oType;
            sortObj[table] = {};
            sortObj[table][child_field] = order ? order.toLowerCase() : "asc" as oType;    // standaard asc
            retVal.push(sortObj);
         }
         else
         {
            const sortObj = {} as oType;
            sortObj[field] = order ? order.toLowerCase() : "asc" as oType;    // standaard asc
            retVal.push(sortObj);
         }
      });
      return retVal;
   }

   protected SelectStringToInclude<oType>(tables: string): oType
   {
      if (!tables) return undefined;

      const retObj: oType = {} as oType;
      tables.split(',').forEach(field =>  // splits op komma
      {
         retObj[field.trim()] = true
      });
      return retObj;
   }
}