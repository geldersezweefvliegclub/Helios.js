import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class CreateOperDienstDto {
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  AANWEZIG?: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  AFWEZIG?: number | null;
}
