import { ApiProperty } from "@nestjs/swagger";

export class SysSyncDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LID_ID: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STARTLIJST_ID: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VLIEGTUIG_ID: number | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  DATA: string | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
