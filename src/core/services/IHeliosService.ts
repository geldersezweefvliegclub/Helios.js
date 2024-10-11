import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsReponse";
import {Prisma, RefTypesGroepen} from "@prisma/client";
import {GetObjectsDateRequest, GetObjectsRequest} from "../DTO/IHeliosFilter";

export abstract class IHeliosService
{
   // The output format of the GetObjects call
   protected buildGetObjectsResponse<Type>(objects: Type[]): IHeliosGetObjectsResponse<Type>
   {
      return {
         dataset: objects,
         totaal: objects.length,
         hash: "hash"
      }
   }

   // Convert a string like "field1 asc, field2 desc" to an array of objects like [{field1: "asc"}, {field2: "desc"}]
   // This is used to sort the results of a prisma query
   protected Sort<oType>(sort: string): oType[]
   {
      const retVal: oType[] = [];
      if (!sort) return undefined;

      sort.split(',').forEach(part =>  // split on comma
      {
         const [field, order] = part.trim().split(' ');
         const s = {} as oType;
         s[field] = order ? order.toLowerCase() : "asc" as oType;    // default to asc
         retVal.push(s);
      });
      return retVal;
   }

   // Convert the CSV string with field name to a select object
   // This is used to limit the number of field which will returned from a prisma query
   protected Select<oType>(fields: string): oType
   {
      const retObj: oType = {} as oType;
      if (!fields) return undefined;
      fields.split(',').forEach(field =>  // split on comma
      {
         retObj[field] = true
      });
      return retObj;
   }
}