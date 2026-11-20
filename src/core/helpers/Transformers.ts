import {Transform} from "class-transformer";


// "1" en "0" worden ook geaccepteerd (net als isBOOL() in PHP): Pegasus stuurt bv. VERWIJDERD=1 voor het archief.
// Zonder deze waarden werd "1" stilletjes undefined, waardoor het filter genegeerd werd
const optionBooleanMapper = new Map<string, boolean>([
   ["undefined", undefined],
   ["true", true],
   ["false", false],
   ["1", true],
   ["0", false]
]);

/**
 * Decorator. Zet een optionele boolean om naar een boolean (of undefined) met behulp van de optionBooleanMapper
 * Probleem: bij het gebruik van class transformer om query parameters om te zetten, zorgt @Type(() => Boolean) er altijd voor dat het naar een boolean true wordt omgezet
 *
 * @example class SomeRequest {
 *     @IsBoolean()
 *     @IsOptional()
 *     @OptionalBooleanTransform()
 *     someBoolean?: boolean;
 * };
 */

export const OptionalBooleanTransform = () => Transform((options) => optionBooleanMapper.get(options.value));
export const OptionalNumberTransform = () => Transform((options) => options.value != null ? Number(options.value) : null);
export const OptionalDateTransform = () => Transform((options) => options.value != null ? new Date(options.value) : null);


// zet een string van komma-gescheiden waarden om naar een array van numbers.
// Als de string null of undefined is, wordt null teruggegeven
// Als een waarde geen number is, wordt deze eruit gefilterd
export const CSVTransform = () => Transform((options) =>
{
   const o = options.value != null ? options.value.split(",") : null;
   if (o)
   {
      return o.map(item => item.trim())
         .filter(item => !isNaN(Number(item)))
         .map(Number);
   }
   return o;
});