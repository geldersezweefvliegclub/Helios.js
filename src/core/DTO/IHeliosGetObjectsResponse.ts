/**
 * Generieke class voor alle Helios GetObjects endpoints
 * Type kan elke DTO class zijn waarvoor we de lijst willen teruggeven. Standaard 'never' om de gebruiker te dwingen een type op te geven.
 */
export class IHeliosGetObjectsResponse<Type = never>
{
   dataset: Type[];
   totaal: number;
   hash: string;
}