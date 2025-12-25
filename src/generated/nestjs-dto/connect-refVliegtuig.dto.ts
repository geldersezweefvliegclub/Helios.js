import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectRefVliegtuigDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
