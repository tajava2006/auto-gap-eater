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
  async selectAmountAndPrice() {
    const symbol = 'XRP';
    const networkInfo = await this.bithumb.getNetworkInfo(symbol);
    const bithumbStatus =
      networkInfo.data[0].deposit_status +
      networkInfo.data[0].withdrawal_status;
    if (bithumbStatus !== 2) return;

    const availableKrwPromise = this.userBalanceRepository.findOne({
      where: {
        id: 1,
      },
    });
    const bithumbOrderbookPromise = this.bithumb.getOrderBook(symbol);
    const upbitOrderbookPromise = this.upbitApi.getOrderbook(symbol);

    const [availableKrw, bithumbOrderbook, upbitOrderbook] = await Promise.all([
      availableKrwPromise,
      bithumbOrderbookPromise,
      upbitOrderbookPromise,
    ]);

    if (
      Number(availableKrw.availableBalance) <
      Number(this.configService.get('KRW_MIN_AMOUNT'))
    ) {
      console.log('출금가능한 원화가 작음', availableKrw.availableBalance);
    }

    let buyPrice = 0;
    let totalQuantity = 0;
    let targetAmount = Math.min(
      this.configService.get('KRW_AMOUNT_PER_ONE_CYCLE'),
      Number(availableKrw.availableBalance),
    );

    for (const item of bithumbOrderbook.data.asks) {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      // 현재 아이템의 가격과 수량을 사용할 수 있는 금액과 비교
      if (price * quantity <= targetAmount) {
        // 전체 수량에 현재 아이템의 수량을 더하고 사용한 금액은 뺍니다.
        totalQuantity += quantity;
        targetAmount -= price * quantity;
        // 가장 비싼 가격을 갱신합니다.
        buyPrice = price;
      } else {
        // 현재 아이템을 다 살 수 없는 경우 일부만 산 후 종료합니다.
        const partialQuantity = Math.floor(targetAmount / price);
        totalQuantity += partialQuantity;
        targetAmount -= price * partialQuantity;
        buyPrice = price;
        break;
      }
    }

    const consumedKrw = Math.min(
      this.configService.get('KRW_AMOUNT_PER_ONE_CYCLE'),
      Number(availableKrw.availableBalance),
    );

    let rewardkRW = 0;
    let amountShouldbeSold = totalQuantity;

    for (const order of upbitOrderbook[0].orderbook_units) {
      const price = order.bid_price;
      const size = order.bid_size;

      // 현재 가격과 수량을 사용할 수 있는 금액과 비교합니다.
      if (size <= amountShouldbeSold / price) {
        // 전체 금액에 현재 가격 * 수량을 더합니다.
        rewardkRW += size * price;
        // 사용한 금액은 뺍니다.
        amountShouldbeSold -= size;
      } else {
        // 현재 가격의 수량을 모두 팔아야 하는 경우
        rewardkRW += amountShouldbeSold * price;
        break;
      }
    }

    // 너무 최적가격으로 주문을 내면 다 안 사질 염려가 있으므로 1틱 비싸게 주문함. 그에 따라 수량은 적당히 적게 조절함
    // todo 심볼별로 몇 원 비싸게 살 것인지 수량을 얼마나 줄여야 할 것인지 다르게 해줘야 할 수 있음
    totalQuantity = totalQuantity - 100;
    buyPrice = buyPrice + 1;
    console.log('지정가격: ', buyPrice);
    console.log('구매수량: ', totalQuantity);
    console.log('최종소비원화: ', consumedKrw);
    console.log('예상판매가격:', rewardkRW);
    console.log('차액: ', rewardkRW - consumedKrw);
    console.log('퍼센트: ', ((rewardkRW - consumedKrw) * 100) / consumedKrw);

    if (
      ((rewardkRW - consumedKrw) * 100) / consumedKrw >
      this.configService.get('THRESHOLD_TO_RUN')
    ) {
      console.log('gogogo');
      return {
        run: true,
        buyPrice,
        totalQuantity,
      };
    } else {
      console.log('nonono');
      return {
        run: false,
      };
    }
  }
}
