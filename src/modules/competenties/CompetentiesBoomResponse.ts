import {RefCompetentieDto} from "../../generated/nestjs-dto/refCompetentie.dto";
import {ApiProperty} from "@nestjs/swagger";

export class CompetentiesBoomResponse extends RefCompetentieDto {
    @ApiProperty({
        description: "Afgeleide competenties",
        type: () => CompetentiesBoomResponse
    })
    children: CompetentiesBoomResponse[];
}