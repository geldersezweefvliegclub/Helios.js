import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class DDWVConfiguratie {
    @ApiProperty({type: Boolean, description: 'Is er een DDWV bedrijf actief'})
    public DDWV: boolean;

    @ApiProperty({type: String, description: 'Begindatum van het DDWV seizoen'})
    public START: string;

    @ApiProperty({type: String, description: 'Einddatum van het DDWV seizoen'})
    public EIND: string;

    @ApiProperty({type: Number, description: 'Maximaal aantal strippen dat een DDWV\'er mag hebben'})
    public MAX_STRIPPEN: number;

    @ApiProperty({type: Number, description: 'Aantal strippen dat retour gaat als de vliegdag doorgaat'})
    public STRIPPEN_RETOUR_OP_VLIEGDAG: number;

    @ApiPropertyOptional({
        type: 'object',
        additionalProperties: {type: 'number'},
        description: 'Transactie type ID per aantal dagen voor de vliegdag, met \'default\' als terugval'
    })
    public TARIEVEN?: Record<string, number>;
}
