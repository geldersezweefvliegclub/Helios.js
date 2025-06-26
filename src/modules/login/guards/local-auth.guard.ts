import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()

// LocalAuthGuard is a guard that will be used for http requests to authenticate a user.
export class LocalAuthGuard extends AuthGuard('local') {}