import { Injectable, OnModuleInit } from '@nestjs/common';
import { UpbitApi } from './upbit.api';
import { Cron } from '@nestjs/schedule';
import wait from 'src/util/wait';

@Injectable()
export class UpbitService implements OnModuleInit {
  constructor(private readonly upbit: UpbitApi) {}

  async onModuleInit() {
    await wait(5000);
  }
  @Cron('* * * * * *')
  async sellAllCoin() {
    console.log('업비트 무한 매도 스케쥴러');
    const symbol = 'XRP';
    const coinBalance = await this.upbit.getBalance(symbol);
    if (coinBalance.length === 0) return;
    console.log('업비트 코인 잔고 : ', Number(coinBalance[0].balance));
    if (Number(coinBalance[0].balance) < 5) return;
    const sellInfo = await this.upbit.sell(coinBalance[0].balance, symbol);
    console.log('업비트 매도 영수증 : ', sellInfo);
  }
}
