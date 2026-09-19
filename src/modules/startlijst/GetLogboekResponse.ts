import {ApiProperty, ApiTags} from "@nestjs/swagger";

// logboek-projectie van een vlucht, zie de $velden lijst in GetLogboek() in class.Startlijst.inc.php
@ApiTags('Startlijst')
export class GetLogboekResponse
{
   @ApiProperty({type: "integer", format: "int32"})
   ID: number;

   @ApiProperty({type: String, format: "date", description: 'Datum van de start'})
   DATUM: Date;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Registratie en callsign van het vliegtuig'})
   REG_CALL?: string | null;

   @ApiProperty({type: "integer", format: "int32"})
   VLIEGTUIG_ID: number;

   @ApiProperty({type: String, required: false, nullable: true, format: "time", description: 'Starttijd (HH:mm:ss)'})
   STARTTIJD?: Date | null;

   @ApiProperty({type: String, required: false, nullable: true, format: "time", description: 'Landingstijd (HH:mm:ss)'})
   LANDINGSTIJD?: Date | null;

   @ApiProperty({type: String, required: false, description: 'Vliegduur (HH:mm)'})
   DUUR?: string;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Naam van de vlieger, aangevuld met de vrije-tekst naam als die is ingevuld'})
   VLIEGERNAAM?: string | null;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Naam van de inzittende, of de pax-naam als dit een pax-vlucht was'})
   INZITTENDENAAM?: string | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   VLIEGER_ID?: number | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   INZITTENDE_ID?: number | null;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Omschrijving van de startmethode'})
   STARTMETHODE?: string | null;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Omschrijving van het vliegveld'})
   VELD?: string | null;

   @ApiProperty({type: Boolean, required: false, description: 'Is dit een pax-vlucht'})
   PAX?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is dit een instructievlucht'})
   INSTRUCTIEVLUCHT?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is dit een checkstart'})
   CHECKSTART?: boolean;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Omschrijving van het vliegtuigtype'})
   VLIEGTUIGTYPE?: string | null;

   @ApiProperty({type: String, required: false, nullable: true})
   OPMERKINGEN?: string | null;
}
