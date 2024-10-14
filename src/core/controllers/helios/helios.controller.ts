import {
   applyDecorators,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpException,
   HttpStatus, Patch,
   Post,
   Put,
   Type
} from '@nestjs/common';
import {Prisma} from "@prisma/client";
import {ApiExtraModels, ApiOperation, ApiQuery, ApiResponse, getSchemaPath} from "@nestjs/swagger";

@Controller('helios')
export class HeliosController {
   // for more information, see https://www.prisma.io/docs/orm/reference/error-reference
   handlePrismaError(e: Prisma.PrismaClientValidationError |
                        Prisma.PrismaClientKnownRequestError |
                        Prisma.PrismaClientUnknownRequestError  |
                        Prisma.PrismaClientInitializationError |
                        Prisma.PrismaClientRustPanicError)
   {
      if (e instanceof Prisma.PrismaClientKnownRequestError)
      {
         switch (e.code)
         {
            //--------------------------------------------------------------------------------------------------
            // COMMON ERROR CODES,
            case 'P1000':
               throw new HttpException('Database authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1001':
               throw new HttpException('Can\'t reach database server', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1002':
               throw new HttpException('Database server timeout', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1003':
               throw new HttpException('Database does not exists', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1008':
               throw new HttpException('Operations timed out', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1009':
               throw new HttpException('Database already exists', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1010':
               throw new HttpException('Database access denied', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1011':
               throw new HttpException('Error opening a TLS connection', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1012':
               throw new HttpException('{full_error}', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1013':
               throw new HttpException('The provided database string is invalid', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1014':
               throw new HttpException('The underlying {kind} for model does not exist.', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1015':
               throw new HttpException('Your Prisma schema is using features that are not supported for the version of the database', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1016':
               throw new HttpException('Your raw query had an incorrect number of parameters', HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P1017':
               throw new HttpException('Server has closed the connection.', HttpStatus.INTERNAL_SERVER_ERROR)

            //--------------------------------------------------------------------------------------------------
            // Prisma Client Query Engine
            case 'P2000':
               throw new HttpException(this.printMessage(e.message), HttpStatus.BAD_REQUEST);

            case 'P2001':
               throw new HttpException("The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2002':
               throw new HttpException(this.printMessage(e.message), HttpStatus.BAD_REQUEST);

            case 'P2003':
               throw new HttpException("Foreign key constraint failed on the field: {meta.field_name}", HttpStatus.BAD_REQUEST);

            case 'P2004':
               throw new HttpException("A constraint failed on the database: {meta.database_error}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2005':
               throw new HttpException("The value {meta.field_value} stored in the database for the field {meta.field_name} is invalid for the field's type", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2006':
               throw new HttpException("The provided value {field_value} for {model_name} field {field_name} is not valid", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2007':
               throw new HttpException("Data validation error {database_error}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2008':
               throw new HttpException("Failed to parse the query {query_parsing_error} at {query_position}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2009':
               throw new HttpException("Failed to validate the query: {query_validation_error} at {query_position}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2010':
               throw new HttpException("Raw query failed. Code: {code}. Message: {message}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2011':
               throw new HttpException("Null constraint violation on the {constraint}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2012':
               throw new HttpException("Missing a required value at {path}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2013':
               throw new HttpException("Missing the required argument {argument_name} for field {field_name} on {object_name}.", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2014':
               throw new HttpException("The change you are trying to make would violate the required relation '{relation_name}' between the {model_a_name} and {model_b_name} models.", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2015':
               throw new HttpException("A related record could not be found. {details}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2016':
               throw new HttpException("Query interpretation error. {details}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2017':
               throw new HttpException("The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2018':
               throw new HttpException("The required connected records were not found. {details}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2019':
               throw new HttpException("Input error. {details}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2020':
               throw new HttpException(e.meta.details, HttpStatus.BAD_REQUEST);

            case 'P2021':
               throw new HttpException("The table {table} does not exist in the current database.", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2022':
               throw new HttpException("The column {column} does not exist in the current database.", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2023':
               throw new HttpException("Inconsistent column data: {message}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2024':
               throw new HttpException("Timed out fetching a new connection from the connection pool. (More info: http://pris.ly/d/connection-pool (Current connection pool timeout: {timeout}, connection limit: {connection_limit})", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2025':
               throw new HttpException("An operation failed because it depends on one or more records that were required but not found. {cause}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2026':
               throw new HttpException("The current database provider doesn't support a feature that the query used: {feature}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2027':
               throw new HttpException("Multiple errors occurred on the database during query execution: {errors}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2028':
               throw new HttpException("Transaction API error: {error}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2029':
               throw new HttpException("Query parameter limit exceeded error: {message}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2030':
               throw new HttpException("Cannot find a fulltext index to use for the search, try adding a @@fulltext([Fields...]) to your schema", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2031':
               throw new HttpException("Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set. See details: https://pris.ly/d/mongodb-replica-set", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2033':
               throw new HttpException("A number used in the query does not fit into a 64 bit signed integer. Consider using BigInt as field type if you're trying to store large integers", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2034':
               throw new HttpException("Transaction failed due to a write conflict or a deadlock. Please retry your transaction", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2035':
               throw new HttpException("Assertion violation on the database: {database_error}", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2036':
               throw new HttpException("Error in external connector (id {id})", HttpStatus.INTERNAL_SERVER_ERROR);

            case 'P2037':
               throw new HttpException("Too many database connections opened: {message}", HttpStatus.INTERNAL_SERVER_ERROR);

            default:
               throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
         }
      }

      if (e instanceof Prisma.PrismaClientValidationError)
         throw new HttpException(this.printMessage(e.message), HttpStatus.BAD_REQUEST);

      throw new HttpException(this.printMessage(e.message), HttpStatus.INTERNAL_SERVER_ERROR);
   }

   printMessage(message: string): string {
      if (message === undefined || message === null) {
         return ''
      }
      const lines = message.split('\n');
      return (lines.length === 0) ? message : lines[lines.length - 1].trim();
   }
}


export const HeliosGetObject = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
    applyDecorators(
      Get("GetObject"),
      ApiExtraModels(dataDto),
      ApiQuery({name: 'ID', required: true, type: Number}),
      ApiOperation({ summary: 'Ophalen enkel record op basis van ID' }),
      ApiResponse({ status: HttpStatus.OK, description: 'Record opgehaald.',   schema: {
            '$ref': getSchemaPath(dataDto)
         }}),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );


export const HeliosGetObjects = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
    applyDecorators(
      Get("GetObjects"),
      ApiQuery({name: 'VERWIJDERD', required: false, type: Boolean}),
      ApiQuery({name: 'VELDEN', required: false, type: String}),
      ApiQuery({name: 'SORT', required: false, type: String}),
      ApiQuery({name: 'MAX', required: false, type: Number}),
      ApiQuery({name: 'START', required: false, type: Number}),
      ApiQuery({name: 'HASH', required: false, type: String}),
      ApiQuery({name: 'IDs', required: false, type: String}),
      ApiQuery({name: 'ID', required: false, type: Number}),
      ApiOperation({ summary: 'Ophalen records uit de database' }),
      ApiResponse({ status: HttpStatus.OK, description: 'Data opgehaald.',   schema: {
            type: 'object',
            properties:
               {
                  dataset:
                     {
                        type: 'array',
                        items: {$ref: getSchemaPath(dataDto)},
                     },
                  totaal: {type: 'number'},
                  hash: {type: 'string'},
               }
         }})
   );

export const HeliosCreateObject = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
   applyDecorators(
      Post("SaveObject"),
      ApiExtraModels(dataDto),
      ApiOperation({ summary: 'Aanmaken nieuw record' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data' }),
      ApiResponse({ status: HttpStatus.CREATED, description: 'Record aangemaakt.', schema: {
            '$ref': getSchemaPath(dataDto)
         }})
   );

export const HeliosUpdateObject = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
    applyDecorators(
      Put("SaveObject"),
      ApiExtraModels(dataDto),
      ApiOperation({ summary: 'Update van bestaand record' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data' }),
      ApiResponse({ status: HttpStatus.CREATED, description: 'Record aangepast.', schema: {
            '$ref': getSchemaPath(dataDto)
         }})
   );

export const HeliosDeleteObject = () =>
    applyDecorators(
      Delete("DeleteObject"),
      ApiQuery({name: 'ID', required: true, type: Number}),
      HttpCode(HttpStatus.NO_CONTENT),
      ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Het record is succesvol verwijderd.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' }),
      ApiResponse({ status: HttpStatus.CONFLICT, description: 'Record is reeds verwijderd.' })
   );

export const HeliosRemoveObject = () =>
    applyDecorators(
      Delete("RemoveObject"),
      ApiQuery({name: 'ID', required: true, type: Number}),
      HttpCode(HttpStatus.GONE),
      ApiResponse({ status: HttpStatus.GONE, description: 'Het record is succesvol verwijderd.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );

export const HeliosRestoreObject = () =>
    applyDecorators(
      Patch("RestoreObject"),
      ApiQuery({name: 'ID', required: true, type: Number}),
      ApiResponse({ status: HttpStatus.OK, description: 'Het record is succesvol hersteld.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );

