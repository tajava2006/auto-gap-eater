import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BithumbApi } from './bithumb.api';

@Injectable()
export class BithumbService {
  constructor(
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
  ) {}
}
