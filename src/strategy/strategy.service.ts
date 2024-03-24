import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class StrategyService implements OnModuleInit {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepository: Repository<UserBalance>,
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
  ) {}

  async onModuleInit() {
    if (this.configService.get('INIT') === '1') {
      const userBalance = new UserBalance();
      userBalance.id = 1;
      const aa = await this.bithumb.getBalance('XRP');
      userBalance.totalBalance = aa.data.available_krw;
      userBalance.availableBalance = aa.data.available_krw;
      userBalance.frozenBalance = '0';
      this.userBalanceRepository.save(userBalance);
    }
  }

  @Cron('* * * * * *')
  async asdf() {
    const aa = await this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    console.log(aa);
  }
}
