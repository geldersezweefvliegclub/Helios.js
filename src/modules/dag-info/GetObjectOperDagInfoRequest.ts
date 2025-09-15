import {Transform} from "class-transformer";
import {IsDate, IsInt, IsOptional} from "class-validator";

/**
 * DTO class for requesting a SINGLE OperDagInfo object
 */
export class GetObjectOperDagInfoRequest {
    @IsOptional()
    @IsInt()
    ID?: number;

    @Transform(({ value }) =>  new Date(value))
    @IsDate()
    @IsOptional()
    public DATUM: Date;
}
