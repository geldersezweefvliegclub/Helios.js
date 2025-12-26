import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectRefTypeGroepDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
