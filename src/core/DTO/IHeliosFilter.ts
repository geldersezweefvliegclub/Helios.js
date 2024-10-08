import {IsBoolean, IsDate, IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";
import {OptionalBooleanTransform, OptionalNumberTransform} from "../helpers/Transformers";

// class as query parameter to get a single object
export class GetObjectRequest {
    @IsInt()
    @Type(() => Number)
    public ID: number;
}

// base class as query parameter to get multiple objects
export class GetObjectsRequest {
    @IsInt()
    @OptionalNumberTransform()
    @IsOptional()
    public ID?: number;

    @IsBoolean()
    @OptionalBooleanTransform()
    @IsOptional()
    public VERWIJDERD?: boolean;

    @IsOptional()
    public HASH?: string;

    @IsOptional()
    public SORT?: string;

    @IsInt()
    @OptionalNumberTransform()
    @IsOptional()
    public MAX?: number;

    @IsInt()
    @OptionalNumberTransform()
    @IsOptional()
    public START?: number;

    @IsOptional()
    public VELDEN?: string;
}

export class GetObjectsDateRequest extends GetObjectsRequest {

    @IsDate()
    @IsOptional()
    public DATUM?: Date;

    @IsDate()
    @IsOptional()
    public BEGIN_DATUM?: Date;

    @IsDate()
    @IsOptional()
    public EIND_DATUM?: Date;
}

