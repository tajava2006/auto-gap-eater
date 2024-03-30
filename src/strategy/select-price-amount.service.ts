import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import wait from 'src/util/wait';
import { UserBalance } from './entities/user-balance.entity';
import { KrwDeposit } from './entities/krw-deposit.entity';
import { Repository } from 'typeorm';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { UpbitApi } from '../upbit/upbit.api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SelectPriceAmountService implements OnModuleInit {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepository: Repository<UserBalance>,
    @InjectRepository(KrwDeposit)
    private readonly krwDepositRepository: Repository<KrwDeposit>,
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
    private readonly upbitApi: UpbitApi,
  ) {}
  async onModuleInit() {
    await wait(5000);
  }
  @Cron('* * * * * *')
  async select() {
    console.log(111);
  }
}
