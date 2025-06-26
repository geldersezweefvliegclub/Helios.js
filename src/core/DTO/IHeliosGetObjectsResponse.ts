/**
 * Generic class for all Helios GetObjects endpoints
 * Type can be any DTO class which we want to return the list for. Defaults to 'never' to force the user to specify a type.
 */
export class IHeliosGetObjectsResponse<Type = never>
{
   dataset: Type[];
   totaal: number;
   hash: string;
}