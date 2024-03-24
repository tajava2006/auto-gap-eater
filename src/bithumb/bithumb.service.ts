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
    const symbol = 'btdc';
    const res = await this.bithumb.getBalance(symbol);
    // const res = await this.bithumb.buy(symbol, '100000', '100');
    console.log(res);
  }
}
