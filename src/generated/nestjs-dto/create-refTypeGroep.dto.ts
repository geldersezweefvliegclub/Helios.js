import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRefTypeGroepDto {
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXT_REF?: string | null;
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SORTEER_VOLGORDE?: number | null;
}
