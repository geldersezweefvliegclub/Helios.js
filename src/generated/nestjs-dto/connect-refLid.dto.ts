import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class ConnectRefLidDto {
  @ApiProperty({
    description:
      "De primary ID van het lid, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
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
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string;
  @ApiProperty({
    description: "Inlognaam voor de website",
    maxLength: 45,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INLOGNAAM?: string;
}
