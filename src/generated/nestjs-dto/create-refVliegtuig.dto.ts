import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRefVliegtuigDto {
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  REGISTRATIE: string;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CALLSIGN?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  FLARMCODE?: string | null;
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
  URL?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
