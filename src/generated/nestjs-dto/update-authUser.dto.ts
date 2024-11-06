import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateAuthUserDto {
  @ApiProperty({
    description:
      "De primary ID van de gebruiker, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Verwijzing naar het lid",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description: "Het referesh token om ingelogd te blijven",
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  REFRESH_TOKEN?: string;
}
