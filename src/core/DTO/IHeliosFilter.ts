import {IsBoolean, IsDate, IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";
import {OptionalBooleanTransform, OptionalNumberTransform, CSVTransform} from "../helpers/Transformers";

// class as query parameter to get a single object
export class GetObjectRequest
{
   @IsInt()
   @Type(() => Number)
   public ID: number;
}

// base class as query parameter to get multiple objects via the GetObjects call
export class GetObjectsRequest
{
   @IsInt()
   @OptionalNumberTransform()
   @IsOptional()
   public ID?: number;

   @CSVTransform()
   @IsOptional()
   public IDs?: number[];

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

// The generic class when a DATUM field is available in the object
export class GetObjectsDateRequest extends GetObjectsRequest
{

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

