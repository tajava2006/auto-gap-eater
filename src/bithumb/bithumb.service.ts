import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XCoinAPIService } from './bithumb.api';

@Injectable()
export class BithumbService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly bithumb: XCoinAPIService,
  ) {}
  async onModuleInit() {
    const rgParams = {
      order_currency: 'XRP',
      payment_currency: 'KRW',
    };
    const res = await this.bithumb.xcoinApiCall('/info/account', rgParams);
    try {
      return console.log(res);
    } catch (err) {
      throw console.error(err);
    }
  }
}
