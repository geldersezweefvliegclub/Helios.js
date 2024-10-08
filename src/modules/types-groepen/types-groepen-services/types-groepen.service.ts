import {Injectable} from '@nestjs/common';
import {DbService} from "../../../database/db-service/db.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../../core/services/IHeliosService";
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";

@Injectable()
export class TypesGroepenService extends IHeliosService
{

    constructor(private readonly dbService: DbService) {
        super();
    }

    // retrieve a single object from the database based on the id
    async GetObject(id: number): Promise<RefTypesGroepen> {
        return this.dbService.refTypesGroepen.findUnique({
            where: {
                ID: id
            }
        });
    }

    // retrieve objects from the database based on the query parameters
    async GetObjects(params:GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepen>>
    {
        const where: Prisma.RefTypesGroepenWhereInput = {}; // = this.Where<Prisma.RefTypesGroepenWhereInput>(params)

        const w =  this.Where<Prisma.RefTypesGroepenWhereInput>(params)
        const sort = params.SORT ? params.SORT : "ID";

        const objs = await this.dbService.refTypesGroepen.findMany({
            where: where,
            orderBy: this.Sort<Prisma.RefTypesGroepenOrderByWithRelationInput>(params.SORT),
            // select: this.Select<Prisma.RefTypesGroepenSelect>(params.VELDEN),
            take: params.MAX,
            skip: params.START
        });


      return this.buildGetObjectsResponse(objs);
    }
}
