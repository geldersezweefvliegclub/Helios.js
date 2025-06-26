import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectOperRoosterDto {
  @ApiProperty({
    description: "Het unieke ID van de dienst",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
