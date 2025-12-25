import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectRefCompetentiesDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
