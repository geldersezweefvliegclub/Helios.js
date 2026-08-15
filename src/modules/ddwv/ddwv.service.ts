import {Injectable, Logger} from '@nestjs/common';

@Injectable()
export class DdwvService {
    private readonly logger = new Logger(DdwvService.name);
}
