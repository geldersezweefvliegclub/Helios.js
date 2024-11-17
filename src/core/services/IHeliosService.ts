import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsReponse";
import {crc32} from "js-crc";

export abstract class IHeliosService
{
   // The output format of the GetObjects call
   protected buildGetObjectsResponse<Type>(objects: Type[], count = undefined): IHeliosGetObjectsResponse<Type>
   {
      return {
         dataset: objects,
         totaal: count ? count : objects.length,      // if count is not defined return the length of the array
         hash: crc32(JSON.stringify(objects))
      }
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

   // Convert the CSV string with field name to a select object
   // This is used to limit the number of field which will returned from a prisma query
   protected SelectStringToSelectObj<oType>(fields: string): oType
   {
      if (!fields) return undefined;

      const retObj: any = {};
      const fieldArray = fields.split(',').map(field => field.trim());

      fieldArray.forEach(field => {
         const parts = field.split('.');
         if (parts.length > 1) {
            if (!retObj[parts[0]]) {
               retObj[parts[0]] = { select: {} };
            }
            retObj[parts[0]].select[parts[1]] = true;
         } else {
            retObj[parts[0]] = true;
         }
      });

      return retObj as oType;
   }

   protected SelectStringToInclude<oType>(fields: string): oType
   {
      if (!fields) return undefined;

      const retObj: oType = {} as oType;
      fields.split(',').forEach(field =>  // split on comma
      {
         retObj[field.trim()] = true
      });
      return retObj;
   }
}