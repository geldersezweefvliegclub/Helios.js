import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateOperDagrapportDto {
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INCIDENTEN?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGBEDRIJF?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  METEO?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DIENSTEN?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VERSLAG?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ROLLENDMATERIEEL?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGENDMATERIEEL?: string | null;
}
