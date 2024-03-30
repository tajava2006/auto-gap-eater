import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BithumbApi } from './bithumb.api';
import wait from '../util/wait';

@Injectable()
export class BithumbService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
  ) {}
  async onModuleInit() {
    await wait(5000);
    const symbol = 'XRP';
    const res = await this.bithumb.getBalance(symbol);
    // res;
    // const res = await this.bithumb.buy(symbol, '100000', '100');
    console.log(res);
  }
}
