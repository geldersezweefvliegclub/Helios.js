import {
   applyDecorators,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus, Patch,
   Post,
   Put,
   Type, UseGuards
} from '@nestjs/common';
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiQuery, ApiResponse, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";

@Controller('helios')
export class HeliosController {

}

//--------------------------------------------------------------------------------------------------
// Swagger Api DECORATORS
//--------------------------------------------------------------------------------------------------

// Swagger definitie voor het ophalen van een enkel record. Dit is universeel en kan in elke controller gebruikt worden.
// Input is een ID en het resultaat is een enkel record. Indien record niet gevonden is wordt een NOT_FOUND status teruggegeven.
export const HeliosGetObject = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
    applyDecorators(
      Get("GetObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiExtraModels(dataDto),
      ApiOperation({ summary: 'Ophalen enkel record op basis van ID.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.' }),
      ApiResponse({ status: HttpStatus.OK, description: 'Record opgehaald.',   schema: {
            '$ref': getSchemaPath(dataDto)
         }}),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );


// Swagger definitie voor het ophalen van records. Dit is universeel en kan in elke controller gebruikt worden.
// Resultaat is een array van records en een totaal aantal records. De hash is een checksum van de data.
// De query parameters zijn optioneel en kunnen gebruikt worden om de data te filteren, wordt als where clausule gebruikt.
export const HeliosGetObjects = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
    applyDecorators(
      Get("GetObjects"),
      ApiBasicAuth,
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
       ApiExtraModels(dataDto),
      ApiOperation({ summary: 'Ophalen records uit de database.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.NOT_MODIFIED, description: 'Data is ongewijzigd.' }),
      ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.' }),
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


// Swagger definitie voor het aanmaken van een nieuw record. Dit is universeel en kan in elke controller gebruikt worden.
// dataDto is het object wat door de service wordt aangemaakt en wordt teruggegeven naar de client.

export const HeliosCreateObject = <InputDto extends Type<unknown>, OutputDto extends Type<unknown>>(inputDto: InputDto, outputDto: OutputDto, ) =>
   applyDecorators(
      Post("AddObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiExtraModels(inputDto),
      ApiOperation({ summary: 'Aanmaken nieuw record.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.CONFLICT, description: 'Data bestaat al.' }),
      ApiResponse({ status: HttpStatus.CREATED, description: 'Record aangemaakt.', schema: {
            '$ref': getSchemaPath(outputDto)
         }})
   );

// Swagger definitie voor een update van een bestaand record. Dit is universeel en kan in elke controller gebruikt worden.
// dataDto is het object wat door de service wordt ontvangen en data vanuit de database wordt teruggegeven naar de client.
export const HeliosUpdateObject = <InputDto extends Type<unknown>, OutputDto extends Type<unknown>>(inputDto: InputDto, outputDto: OutputDto, ) =>
    applyDecorators(
      Put("UpdateObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiExtraModels(inputDto),
      ApiOperation({ summary: 'Update van bestaand record.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.CONFLICT, description: 'Data bestaat al.' }),
      ApiResponse({ status: HttpStatus.CREATED, description: 'Record aangepast.', schema: {
            '$ref': getSchemaPath(outputDto)
         }})
   );

// Swagger definitie voor het verwijderen van een record. Dit is universeel en kan in elke controller gebruikt worden.
// Alleen het ID is noodzakelijk om een record te markeren als verwijderd.
export const HeliosDeleteObject = () =>
    applyDecorators(
      Delete("DeleteObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiQuery({name: 'ID', required: true, type: Number}),
      HttpCode(HttpStatus.NO_CONTENT),
      ApiOperation({ summary: 'Markeer record als verwijderd door VERWIJDERD op true te zetten.' }),
      ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Het record is succesvol verwijderd.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' }),
   );

// Swagger definitie voor het fysiek verwijderen van een record. Dit is universeel en kan in elke controller gebruikt worden.
// Alleen het ID is noodzakelijk om een record uit de database te verwijderen. Dit is een permanente actie en kan niet teruggedraaid worden.
export const HeliosRemoveObject = () =>
    applyDecorators(
      Delete("RemoveObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiQuery({name: 'ID', required: true, type: Number}),
      HttpCode(HttpStatus.GONE),
      ApiOperation({ summary: 'Verwijderen record uit de database, herstel niet mogelijk.' }),
      ApiResponse({ status: HttpStatus.GONE, description: 'Het record is succesvol verwijderd.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );

// Swagger definitie voor het herstellen van een record. Dit is universeel en kan in elke controller gebruikt worden.
// Alleen het ID is noodzakelijk om een record te herstellen. De markering als verwijderd wordt ongedaan gemaakt.
export const HeliosRestoreObject = () =>
    applyDecorators(
      Patch("RestoreObject"),
      ApiBasicAuth(),
      UseGuards(AuthGuard(['jwt', 'basic-auth'])),
      ApiQuery({name: 'ID', required: true, type: Number}),
      ApiOperation({ summary: 'Maak de verwijdering ongedaan door VERWIJDERD op false te zetten.' }),
      ApiResponse({ status: HttpStatus.OK, description: 'Het record is succesvol hersteld.' }),
      ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' }),
      ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record niet gevonden.' })
   );

