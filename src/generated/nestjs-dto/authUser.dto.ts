import { ApiProperty } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty({
    description:
      "De primary ID van de gebruiker, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Verwijzing naar het lid",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Het referesh token om ingelogd te blijven",
    type: "string",
  })
  REFRESH_TOKEN: string;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
