import {ApiProperty} from "@nestjs/swagger";
import {AuditDto} from "../../generated/nestjs-dto/audit.dto";

export class GetObjectsAuditResponse extends AuditDto
{
   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van het lid dat de data heeft ingevoerd',
   })
   NAAM: string;
}