import {Transform} from "class-transformer";


const optionBooleanMapper = new Map<string, boolean>([
   ["undefined", undefined],
   ["true", true],
   ["false", false]
]);
/**
 * Decorator. Transforms an optional boolean to a boolean (or undefined) using the optionBooleanMapper
 * Problem: when using class transformer to transform query parameters, using @Type(() => Boolean) will always transform to a boolean that is true
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

// converts a string of comma separated values to an array of numbers.
// If the string is null or undefined, it returns null
// If a value is not a number, it is filtered out
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