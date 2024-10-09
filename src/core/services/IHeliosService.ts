import {IHeliosGetObjectsResponse} from "../DTO/IHeliosGetObjectsReponse";
import {Prisma} from "@prisma/client";
import {GetObjectsDateRequest, GetObjectsRequest} from "../DTO/IHeliosFilter";

export abstract class IHeliosService {
    protected buildGetObjectsResponse<Type>(objects: Type[]): IHeliosGetObjectsResponse<Type>
    {
        return {
            dataset: objects,
            totaal: objects.length,
            hash: "hash"
        }
    }

    protected Where<oType extends GetObjectsRequest>(params: any): oType
    {
        const where = {} as oType;

        if(params.ID) where.ID = params.ID;
        if(params.VERWIJDERD) where.VERWIJDERD = params.VERWIJDERD;

        return where
    }

    protected WhereDate<oType extends GetObjectsDateRequest>(params: any): oType
    {
        const where = this.Where<oType>(params);

        if(params.DATUM) where.DATUM = params.DATUM;
        if(params.BEGIN_DATUM) where.BEGIN_DATUM = params.BEGIN_DATUM;
        if(params.EIND_DATUM) where.EIND_DATUM = params.EIND_DATUM;

        return
    }

    // Convert a string like "field1 asc, field2 desc" to an array of objects like [{field1: "asc"}, {field2: "desc"}]
    // This is used to sort the results of a prisma query
    protected Sort<oType>(sort: string): oType[]
    {
        const retVal: oType[] = [];
        sort.split(',').forEach(part =>  // split on comma
        {
            const [field, order] = part.trim().split(' ');
            const s = {} as oType;
            s[field] = order ? order.toLowerCase() : "asc" as oType;    // default to asc
            retVal.push(s);
        });
        return retVal;
    }

    protected Select<oType>(fields: string): oType
    {
        const retObj: oType = {} as oType;
        fields.split(',').forEach(field =>  // split on comma
        {
            retObj[field] = true
        });
        return retObj;
    }
}