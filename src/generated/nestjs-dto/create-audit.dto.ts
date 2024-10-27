import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAuditDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "De datum van de audit",
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    description: "Lid dat de wijziging heeft gedaan",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  LID_ID: number;
  @ApiProperty({
    description: "De database tabel waar de wijziging is gedaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TABEL?: string | null;
  @ApiProperty({
    description: "De naam van de tabel waar de wijziging is gedaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TABEL_NAAM?: string | null;
  @ApiProperty({
    description: "De actie die is uitgevoerd",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ACTIE?: string | null;
  @ApiProperty({
    description: "Het object ID waar de wijziging is gedaan",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  OBJECT_ID?: number | null;
  @ApiProperty({
    description: "De data voordat de wijziging is gedaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VOOR?: string | null;
  @ApiProperty({
    description: "De data die ten grondslag ligt aan de wijziging",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DATA?: string | null;
  @ApiProperty({
    description: "Het resultaat van de wijziging",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  RESULTAAT?: string | null;
}
