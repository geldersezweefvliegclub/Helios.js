import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsReponse";

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
      const retObj: oType = {} as oType;
      if (!fields) return undefined;
      fields.split(',').forEach(field =>  // split on comma
      {
         retObj[field] = true
      });
      return retObj;
   }
}