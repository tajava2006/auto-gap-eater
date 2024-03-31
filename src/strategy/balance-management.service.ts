import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { Repository } from 'typeorm';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { Cron } from '@nestjs/schedule';
import { KrwDeposit } from './entities/krw-deposit.entity';

// 원화 입금후 24시간 출금 제한을 관리하기 위한 서비스
// 입금을 감지하면 frozon balance를 더하고 deposit에 시간과 amount를 기록한다.
// 24시간이 지나면 frozon balance를 빼고 avaliable balance를 더하고 deposit를 지운다
// 모든 deposit가 24시간이 지나 사라지면 소수점 계산 오차를 지우기 위해 밸런스 초기화
@Injectable()
export class BalanceManagementService implements OnModuleInit {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepository: Repository<UserBalance>,
    @InjectRepository(KrwDeposit)
    private readonly krwDepositRepository: Repository<KrwDeposit>,
    private readonly bithumb: BithumbApi,
  ) {}

  async onModuleInit() {
    const dbBalance = await this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    if (!dbBalance) {
      await this.upsertUserBalance();
    }
  }

  async upsertUserBalance() {
    const userBalance = new UserBalance();
    userBalance.id = 1;
    const bithumbBalance = await this.bithumb.getBalance('XRP');
    try {
      userBalance.totalBalance = bithumbBalance.data.available_krw;
      userBalance.availableBalance = bithumbBalance.data.available_krw;
      userBalance.frozenBalance = '0';
      this.userBalanceRepository.upsert(userBalance, ['id']);
    } catch (err) {
      console.log('createUserBalance 빗썸 에러');
    }
  }

  @Cron('*/5 * * * * *')
  async onDeposit() {
    const dbBalancePromise = this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    const realBalancePromise = this.bithumb.getBalance('XRP');

    try {
      const [dbBalance, realBalance] = await Promise.all([
        dbBalancePromise,
        realBalancePromise,
      ]);

      const income =
        Number(realBalance.data.available_krw) - Number(dbBalance.totalBalance);
      if (income > 1) {
        console.log('빗썸에 원화 입금 발생. 입금량 : ', income);
        await this.saveNewDeposit(income);
        dbBalance.frozenBalance = String(
          income + Number(dbBalance.frozenBalance),
        );
        dbBalance.totalBalance = realBalance.data.available_krw;
        const updatedBalance = await this.userBalanceRepository.save(dbBalance);
        console.log('유저 밸런스 업데이트 : ', updatedBalance);
      }
    } catch (err) {
      console.error('onDeposit 함수 빗썸 에러');
      return;
    }
  }

  async saveNewDeposit(income: number) {
    const newDeposit = new KrwDeposit();
    newDeposit.amount = income;
    newDeposit.createdAt = new Date();
    await this.krwDepositRepository.insert(newDeposit);
  }

  @Cron('*/5 * * * * *')
  async rebalanceKrw() {
    const dbBalancePromise = this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    const depositsPromise = this.krwDepositRepository.find();
    const [dbBalance, deposits] = await Promise.all([
      dbBalancePromise,
      depositsPromise,
    ]);
    let count = 0;
    if (deposits.length === 0) return;
    for (const row of deposits) {
      const timeRemaining = new Date().getTime() - row.createdAt.getTime();
      if (timeRemaining < 24 * 3601 * 1000) {
        console.log(
          '원화 입금 제한 유지',
          row.amount,
          ' 원 ',
          (60 * 24 - timeRemaining / (1000 * 60)).toFixed(3),
          ' 분 남음',
        );
        continue;
      }
      console.log('24시간 해제! : ', row.amount);
      dbBalance.frozenBalance = String(
        Number(dbBalance.frozenBalance) - row.amount,
      );
      dbBalance.availableBalance = String(
        Number(dbBalance.availableBalance) + row.amount,
      );
      this.krwDepositRepository.delete(row);
      count += 1;
    }
    if (count === deposits.length) {
      await this.upsertUserBalance();
    }
  }
}
