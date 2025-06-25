import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class ConnectRefLidDto {
  @ApiProperty({
    description:
      "De primary ID van het lid, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string;
  @ApiProperty({
    description: "Inlognaam voor de website",
    maxLength: 45,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  INLOGNAAM?: string;
}
