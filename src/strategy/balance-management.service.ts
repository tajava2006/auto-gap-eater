import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { Repository } from 'typeorm';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { Cron } from '@nestjs/schedule';
import { KrwDeposit } from './entities/krw-deposit.entity';
import { ConfigService } from '@nestjs/config';
import { symbolType } from 'src/util/symbol';

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
    private readonly configService: ConfigService,
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
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');
    const bithumbBalance = await this.bithumb.getBalance(symbol);
    try {
      userBalance.totalBalance = bithumbBalance.data.available_krw;
      userBalance.availableBalance = bithumbBalance.data.available_krw;
      userBalance.frozenBalance = '0';
      userBalance.updatedAt = String(new Date().getTime()) + '000';
      this.userBalanceRepository.upsert(userBalance, ['id']);
    } catch (err) {
      console.log('upsertUserBalance 에러');
    }
  }

  @Cron('* * * * *')
  async onBalanceChange() {
    const dbBalancePromise = this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');
    const myOrderPromise = this.bithumb.getMySuccessOrder(symbol);
    const [dbBalance, myOrder] = await Promise.all([
      dbBalancePromise,
      myOrderPromise,
    ]);
    try {
      for (let i = myOrder.data.length - 1; i >= 0; i--) {
        const order = myOrder.data[i];
        if (Number(order.transfer_date) <= Number(dbBalance.updatedAt) + 1)
          continue;
        switch (order.search) {
          case '1':
            const krwAmount =
              Number(order.amount) + Number(order.fee.replace(/,/g, ''));
            console.log('밸런스 1 오더: ', order, ', krwamount: ', krwAmount);
            dbBalance.availableBalance = String(
              Number(dbBalance.availableBalance) - krwAmount,
            );
            dbBalance.totalBalance = String(
              Number(dbBalance.totalBalance) - krwAmount,
            );
            console.log('밸런스 1 유저 밸런스: ', dbBalance);
            dbBalance.updatedAt = order.transfer_date;
            await this.userBalanceRepository.save(dbBalance);
            break;
          case '2':
            console.log('로직에 실수가 없다면 발생하지 않아야 함');
            break;
          case '4':
            console.log('밸런스 4 원화 입금 오더 :', order);
            if (order.order_currency !== 'KRW') break;
            if (order.payment_currency !== 'KRW') break;
            dbBalance.frozenBalance = String(
              Number(dbBalance.frozenBalance) + Number(order.price),
            );
            dbBalance.totalBalance = String(
              Number(dbBalance.totalBalance) + Number(order.price),
            );
            console.log('밸런스 4 유저밸런스: ', dbBalance);
            dbBalance.updatedAt = order.transfer_date;
            await this.userBalanceRepository.save(dbBalance);
            await this.saveNewDeposit(order.price, order.transfer_date);
            break;
          case '5':
            if (order.order_currency !== 'KRW') break;
            if (order.payment_currency !== 'KRW') break;
            console.log('밸런스 5 원화 출금 : ', order);
            const depositKrw = await this.krwDepositRepository.find();
            let withdrawKrw = Number(order.price.substring(1));
            for (let i = depositKrw.length - 1; i >= 0; i--) {
              if (Number(depositKrw[i].amount) < withdrawKrw) {
                withdrawKrw -= Number(depositKrw[i].amount);
                const result = await this.krwDepositRepository.delete(
                  depositKrw[i],
                );
                console.log('원화 출금으로 인해 이전 입금 삭제 : ', result);
              } else {
                depositKrw[i].amount = String(
                  Number(depositKrw[i].amount) - withdrawKrw,
                );
                const result = await this.krwDepositRepository.save(
                  depositKrw[i],
                );
                console.log('원화 출금으로 인한 이전 입금 삭감 : ', result);
              }
            }
            dbBalance.frozenBalance = String(
              Number(dbBalance.frozenBalance) -
                Number(order.price.substring(1)),
            );
            dbBalance.totalBalance = String(
              Number(dbBalance.totalBalance) - Number(order.price.substring(1)),
            );
            dbBalance.updatedAt = order.transfer_date;
            console.log('밸런스 5 유저 밸런스 : ', dbBalance);
            await this.userBalanceRepository.save(dbBalance);
            break;
          default:
            console.log('onBalance 함수 모르는 케이스');
        }
      }
    } catch (err) {
      console.log('밸런스 함수 에러');
    }
  }

  async saveNewDeposit(price: string, date: string) {
    const newDeposit = new KrwDeposit();
    newDeposit.amount = price;
    newDeposit.createdAt = date;
    await this.krwDepositRepository.insert(newDeposit);
  }

  @Cron('* * * * *')
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
      const timeRemaining = new Date().getTime() * 1000 - Number(row.createdAt);
      if (timeRemaining < 24 * 3601 * 1000000) {
        console.log(
          '원화 입금 제한 유지',
          row.amount,
          ' 원 ',
          (60 * 24 - timeRemaining / (1000000 * 60)).toFixed(3),
          ' 분 남음',
        );
        continue;
      }
      const amountShoudbeRebalanced = Math.min(
        Number(row.amount),
        Number(dbBalance.frozenBalance),
      );
      console.log('리밸런스 함수 플마 금액 : ', amountShoudbeRebalanced);
      console.log('24시간 해제! : ', row.amount, amountShoudbeRebalanced);
      dbBalance.frozenBalance = String(
        Number(dbBalance.frozenBalance) - amountShoudbeRebalanced,
      );
      dbBalance.availableBalance = String(
        Number(dbBalance.availableBalance) + amountShoudbeRebalanced,
      );
      dbBalance.updatedAt = String(new Date().getTime()) + '000';
      console.log('리밸런스 함수 유저 밸런스 :', dbBalance);
      await this.userBalanceRepository.save(dbBalance);
      const deletedrow = await this.krwDepositRepository.delete(row);
      console.log('원화입금 row 삭제 : ', deletedrow);
      count += 1;
    }
    if (count === deposits.length) {
      await this.upsertUserBalance();
    }
  }
}
