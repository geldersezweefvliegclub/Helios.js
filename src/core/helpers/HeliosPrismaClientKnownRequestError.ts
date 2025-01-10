import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus} from "@nestjs/common";
import {Prisma} from "@prisma/client";
import {Response} from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class HeliosPrismaClientKnownRequestError implements ExceptionFilter {
   catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {

      // for more information, see https://www.prisma.io/docs/orm/reference/error-reference
      let httpMsg = "Database error";
      let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
      
      switch (exception.code)
      {
         //--------------------------------------------------------------------------------------------------
         // COMMON ERROR CODES,
         case 'P1000':
            httpMsg = 'Database authentication failed'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1001':
            httpMsg = 'Can\'t reach database server'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1002':
            httpMsg = 'Database server timeout'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1003':
            httpMsg = 'Database does not exists'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1008':
            httpMsg = 'Operations timed out'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1009':
            httpMsg = 'Database already exists'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1010':
            httpMsg = 'Database access denied'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1011':
            httpMsg = 'Error opening a TLS connection'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1012':
            httpMsg = '{full_error}'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1013':
            httpMsg = 'The provided database string is invalid'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1014':
            httpMsg = 'The underlying {kind} for model does not exist.'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1015':
            httpMsg = 'Your Prisma schema is using features that are not supported for the version of the database'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1016':
            httpMsg = 'Your raw query had an incorrect number of parameters'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P1017':
            httpMsg = 'Server has closed the connection.'
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         //--------------------------------------------------------------------------------------------------
         // Prisma Client Query Engine
         case 'P2000':
            httpMsg = this.printMessage(exception.message)
            httpStatus = HttpStatus.BAD_REQUEST; break;

         case 'P2001':
            httpMsg = "The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2002':
            httpMsg = this.printMessage(exception.message)
            httpStatus = HttpStatus.BAD_REQUEST; break;

         case 'P2003':
            httpMsg = "Foreign key constraint failed on the field: {meta.field_name}"
            httpStatus = HttpStatus.BAD_REQUEST; break;

         case 'P2004':
            httpMsg = "A constraint failed on the database: {meta.database_error}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2005':
            httpMsg = "The value {meta.field_value} stored in the database for the field {meta.field_name} is invalid for the field's type"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2006':
            httpMsg = "The provided value {field_value} for {model_name} field {field_name} is not valid"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2007':
            httpMsg = "Data validation error {database_error}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2008':
            httpMsg = "Failed to parse the query {query_parsing_error} at {query_position}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2009':
            httpMsg = "Failed to validate the query: {query_validation_error} at {query_position}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2010':
            httpMsg = "Raw query failed. Code: {code}. Message: {message}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2011':
            httpMsg = "Null constraint violation on the {constraint}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2012':
            httpMsg = "Missing a required value at {path}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2013':
            httpMsg = "Missing the required argument {argument_name} for field {field_name} on {object_name}."
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2014':
            httpMsg = "The change you are trying to make would violate the required relation '{relation_name}' between the {model_a_name} and {model_b_name} models."
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2015':
            httpMsg = "A related record could not be found. {details}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2016':
            httpMsg = "Query interpretation error. {details}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2017':
            httpMsg = "The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected."
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2018':
            httpMsg = "The required connected records were not found. {details}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2019':
            httpMsg = "Input error. {details}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2020':
            httpMsg = exception.meta.details as string
            httpStatus = HttpStatus.BAD_REQUEST; break;

         case 'P2021':
            httpMsg = "The table {table} does not exist in the current database."
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2022':
            httpMsg = "The column {column} does not exist in the current database."
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2023':
            httpMsg = "Inconsistent column data: {message}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2024':
            httpMsg = "Timed out fetching a new connection from the connection pool. (More info: http://pris.ly/d/connection-pool (Current connection pool timeout: {timeout}, connection limit: {connection_limit})"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2025':
            httpMsg = "An operation failed because it depends on one or more records that were required but not found. {cause}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2026':
            httpMsg = "The current database provider doesn't support a feature that the query used: {feature}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2027':
            httpMsg = "Multiple errors occurred on the database during query execution: {errors}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2028':
            httpMsg = "Transaction API error: {error}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2029':
            httpMsg = "Query parameter limit exceeded error: {message}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2030':
            httpMsg = "Cannot find a fulltext index to use for the search, try adding a @@fulltext([Fields...]) to your schema"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2031':
            httpMsg = "Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set. See details: https://pris.ly/d/mongodb-replica-set"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2033':
            httpMsg = "A number used in the query does not fit into a 64 bit signed integer. Consider using BigInt as field type if you're trying to store large integers"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2034':
            httpMsg = "Transaction failed due to a write conflict or a deadlock. Please retry your transaction"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2035':
            httpMsg = "Assertion violation on the database: {database_error}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2036':
            httpMsg = "Error in external connector (id {id})"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;

         case 'P2037':
            httpMsg = "Too many database connections opened: {message}"
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR; break;
      }
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      response
         .status(httpStatus)
         .header('X-Error-Message', httpMsg)
         .json();
   }

   printMessage(message: string): string {
      if (message === undefined || message === null) {
         return ''
      }
      const lines = message.split('\n');
      return (lines.length === 0) ? message : lines[lines.length - 1].trim();
   }
}