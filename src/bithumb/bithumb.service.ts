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
    const symbol = 'xrp';
    const res = await this.bithumb.transfer(
      symbol,
      '100',
      'raQwCVAJVqjrVm1Nj5SFRcX8i22BhdC9WA',
      '3838094008',
    );
    console.log(res);
  }
}
