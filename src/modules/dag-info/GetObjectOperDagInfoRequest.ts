import {Transform, Type} from "class-transformer";
import {IsDate, IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

/**
 * DTO class voor het opvragen van een ENKEL OperDagInfo.prisma object
 */
export class GetObjectOperDagInfoRequest {
    @IsOptional()
    @Type(() => Number)
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
