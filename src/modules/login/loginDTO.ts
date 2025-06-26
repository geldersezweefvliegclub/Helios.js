import {applyDecorators} from "@nestjs/common";
import {ApiQuery} from "@nestjs/swagger";

export const GetLoginRequest  = () =>
   applyDecorators(
      ApiQuery({name: 'INLOGNAAM', required: false, type: String}),
      ApiQuery({name: 'WACHTWOORD', required: false, type: String}),
   );

