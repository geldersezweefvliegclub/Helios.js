import { Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';

@Injectable()

// LocalAuthGuard is een guard die gebruikt wordt voor http requests om een gebruiker te authenticeren.
export class LocalAuthGuard extends AuthGuard('local') {
  // NestJS v12: @Optional() op de parent-constructor wordt niet meer overgenomen door subclasses,
  // dus moet hier expliciet herhaald worden - anders faalt DI-resolutie op AuthModuleOptions
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }
}