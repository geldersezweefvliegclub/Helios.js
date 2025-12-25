import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOperReserveringDto {
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  INGEVOERD_ID?: number;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
