import { Injectable } from '@nestjs/common';
import { UpbitApi } from './upbit.api';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UpbitService {
  constructor(private readonly upbit: UpbitApi) {}

  @Cron('* * * * * *')
  async sellAllCoin() {
    const symbol = 'XRP';
    const coinBalance = await this.upbit.getBalance(symbol);
    if (coinBalance.length === 0) return;
    console.log('업비트 코인 잔고 : ', Number(coinBalance[0].balance));
    if (Number(coinBalance[0].balance) < 5) return;
    const sellInfo = await this.upbit.sell(coinBalance[0].balance, symbol);
    console.log('업비트 매도 요청 영수증 : ', sellInfo);
  }
}
