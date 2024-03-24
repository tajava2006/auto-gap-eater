import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BithumbApi } from './bithumb.api';

@Injectable()
export class BithumbService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
  ) {}
  async onModuleInit() {
    const symbol = 'btc';
    const res = await this.bithumb.getBalance(symbol);
    console.log(res);
  }
}
