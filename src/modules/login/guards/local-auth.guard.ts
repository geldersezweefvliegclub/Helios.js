import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()

// LocalAuthGuard is een guard die gebruikt wordt voor http requests om een gebruiker te authenticeren.
export class LocalAuthGuard extends AuthGuard('local') {}