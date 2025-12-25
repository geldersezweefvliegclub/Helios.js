import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRefCompetentieDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VOLGORDE?: number | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BLOK?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  ONDERWERP?: string;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DOCUMENTATIE?: string | null;
}
