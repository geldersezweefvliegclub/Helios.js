import {Transform} from "class-transformer";
import {IsDate, IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

/**
 * DTO class for requesting a SINGLE OperDagInfo object
 */
export class GetObjectOperDagInfoRequest {
    @IsOptional()
    @IsInt()
    @ApiProperty({name: "ID", required: false, type: Number})
    ID?: number;

    @Transform(({value}) => new Date(value))
    @IsDate()
    @IsOptional()
    @ApiProperty(
        {
            name: 'DATUM',
            required: false,
            type: Date
        })
    public DATUM: Date;
}
