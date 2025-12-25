import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateOperTrackDto {
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TEKST?: string | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    default: new Date().toISOString(),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  INGEVOERD?: Date | null;
}
