import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsReponse";
import {crc32} from "js-crc";
import {HttpException, HttpStatus} from "@nestjs/common";

export abstract class IHeliosService
{
   // The output format of the GetObjects call
   protected buildGetObjectsResponse<Type>(objects: Type[], count = undefined, hash: string = undefined): IHeliosGetObjectsResponse<Type>
   {
      const response = {
         dataset: objects,
         totaal: count ? count : objects.length,      // if count is not defined return the length of the array
         hash: crc32(JSON.stringify(objects))
      } as IHeliosGetObjectsResponse<Type>

      if ((response.hash === hash) && (hash !== undefined)) {
         throw new HttpException("Data is ongewijzigd", HttpStatus.NOT_MODIFIED);
      }

      return response;
   }

   // Convert a string like "field1 asc, field2 desc" to an array of objects like [{field1: "asc"}, {field2: "desc"}]
   // This is used to be using in prismas sort function
   protected SortStringToSortObj<oType>(sort: string): oType[]
   {
      const retVal: oType[] = [];
      if (!sort) return undefined;

      sort.split(',').forEach(part =>  // split on comma
      {
         const [field, order] = part.trim().split(' ');
         const sortObj = {} as oType;
         sortObj[field] = order ? order.toLowerCase() : "asc" as oType;    // default to asc
         retVal.push(sortObj);
      });
      return retVal;
   }

   protected SelectStringToInclude<oType>(tables: string): oType
   {
      if (!tables) return undefined;

      const retObj: oType = {} as oType;
      tables.split(',').forEach(field =>  // split on comma
      {
         retObj[field.trim()] = true
      });
      return retObj;
   }
}