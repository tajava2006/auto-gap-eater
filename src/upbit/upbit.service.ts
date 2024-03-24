import { Injectable, OnModuleInit } from '@nestjs/common';
import { UpbitApi } from './upbit.api';

@Injectable()
export class UpbitService implements OnModuleInit {
  constructor(private readonly upbit: UpbitApi) {}

  async onModuleInit() {
    const symbol = 'KRW';
    // const aa = await this.upbit.sell(1000, symbol);
    // const aa = await this.upbit.getOrdersChange(symbol);
    // const aa = await this.upbit.getBalanceBySymbol(symbol);
    const aa = await this.upbit.withdraws('231');
    console.log(aa);
  }
}
