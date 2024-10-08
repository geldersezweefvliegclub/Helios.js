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