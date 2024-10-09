import {Controller, Get, Query} from '@nestjs/common';
import {ApiQuery} from "@nestjs/swagger";
import {TypesGroepenService} from "../types-groepen-services/types-groepen.service";
import {RefTypesGroepen } from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";

@Controller('TypesGroepen')
export class TypesGroepenController {
    constructor(private readonly typesGroepenService: TypesGroepenService) {
    }

    @Get("GetObject")
    @ApiQuery({name: 'ID', required: true, type: Number})
    GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesGroepen> {
        return this.typesGroepenService.GetObject(queryParams.ID);
    }

    @Get("GetObjects")
    @ApiQuery({name: 'VERWIJDERD', required: false, type: Boolean})
    @ApiQuery({name: 'VELDEN', required: false, type: String})
    @ApiQuery({name: 'SORT', required: false, type: String})
    @ApiQuery({name: 'MAX', required: false, type: Number})
    @ApiQuery({name: 'START', required: false, type: Number})
    @ApiQuery({name: 'HASH', required: false, type: String})
    @ApiQuery({name: 'IDs', required: false, type: String})
    @ApiQuery({name: 'ID', required: false, type: Number})
    GetObjects(@Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepen>> {
        // sort is optional, so if it is not provided, it should default to "SORTEER_VOLGORDE"
        queryParams.SORT = queryParams.SORT ?? "SORTEER_VOLGORDE";
        return this.typesGroepenService.GetObjects(queryParams);
    }
}
