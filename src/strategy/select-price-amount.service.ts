import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import wait from 'src/util/wait';
import { UserBalance } from './entities/user-balance.entity';
import { Repository } from 'typeorm';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { UpbitApi } from '../upbit/upbit.api';
import { ConfigService } from '@nestjs/config';
import { symbolMap, symbolType } from 'src/util/symbol';

@Injectable()
export class SelectPriceAmountService {
  private run = false;
  private buyPrice = 0;
  private totalQuantity = 0;
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepository: Repository<UserBalance>,
    private readonly configService: ConfigService,
    private readonly bithumb: BithumbApi,
    private readonly upbitApi: UpbitApi,
  ) {}

  canRun() {
    return {
      run: this.run,
      buyPrice: this.buyPrice,
      totalQuantity: this.totalQuantity,
    };
  }

  @Cron('*/5 * * * * *')
  private async selectAmountAndPrice() {
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');
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
      console.log('출금가능 원화가 설정가 미만', availableKrw.availableBalance);
      return;
    }
    let buyPrice = 0;
    let buyStartPrice = 0;
    let totalQuantity = 0;
    let targetAmount = Math.min(
      this.configService.get('KRW_AMOUNT_PER_ONE_CYCLE'),
      Number(availableKrw.availableBalance),
    );
    console.log('전략함수 targetAmount : ', targetAmount);
    for (const item of bithumbOrderbook.data.asks) {
      const price = Number(item.price);
      if (buyStartPrice === 0) {
        buyStartPrice = Number(item.price);
      }
      const quantity = Number(item.quantity);
      // 현재 아이템의 가격과 수량을 사용할 수 있는 금액과 비교
      if (price * quantity <= targetAmount) {
        // 전체 수량에 현재 아이템의 수량을 더하고 사용한 금액은 뺍니다.
        totalQuantity += quantity;
        targetAmount -= price * quantity;
        // 가장 비싼 가격을 갱신합니다.
        buyPrice = price;
        console.log(
          '다 사고 다음 껄로 targetAmount, quantity, price, totalquantity : ',
          targetAmount,
          quantity,
          price,
          totalQuantity,
        );
      } else {
        // 현재 아이템을 다 살 수 없는 경우 일부만 산 후 종료합니다.
        const partialQuantity = Math.floor(targetAmount / price);
        totalQuantity += partialQuantity;
        targetAmount -= price * partialQuantity;
        buyPrice = price;
        console.log(
          '여기에서 매수 해결 가능할 때 targetAmount, quantity, price, totalquantity :',
          targetAmount,
          quantity,
          price,
          totalQuantity,
        );
        break;
      }
    }
    if (symbolMap.get(symbol).fee !== 0) {
      // 너무 최적가격으로 주문을 내면 다 안 사질 염려가 있으므로 1틱 비싸게 주문함. 그에 따라 수량은 적당히 적게 조절함
      totalQuantity = totalQuantity - symbolMap.get(symbol).oneTickBonus;
      buyPrice = buyPrice + symbolMap.get(symbol).oneTick;
    } else {
      // 출금수수료가 0인 코인은 다른 전략으로 간다. 소액이라도 출금 수수료 패널티가 없으므로 목표치 만큼 다 안 사져도 ok
      // 오히려 적게 사도 되니까 메이커 리워드를 먹는 것을 목표로 한다. 매수 가격을 최초 가격으로 설정
      // 이후 스케쥴러에서 미체결 주문이 있으면 바로바로 취소
      buyPrice = buyStartPrice;
    }
    let rewardkRW = 0;
    let amountShouldbeSold = totalQuantity;
    for (const order of upbitOrderbook[0].orderbook_units) {
      const price = order.bid_price;
      const size = order.bid_size;
      // 현재 가격과 수량을 사용할 수 있는 금액과 비교합니다.
      if (size <= amountShouldbeSold) {
        // 전체 금액에 현재 가격 * 수량을 더합니다.
        rewardkRW += size * price;
        // 사용한 금액은 뺍니다.
        amountShouldbeSold -= size;
        console.log(
          '다 팔고 다음 껄로 rewardKrw, size, price, amoutntShouldBeSold:',
          rewardkRW,
          size,
          price,
          amountShouldbeSold,
        );
      } else {
        // 현재 가격의 수량을 모두 팔아야 하는 경우
        rewardkRW += amountShouldbeSold * price;
        console.log(
          '여기에서 매도 해결 가능할 때 rewardKrw, size, price, amoutntShouldBeSold:',
          rewardkRW,
          size,
          price,
          amountShouldbeSold,
        );
        break;
      }
    }
    const consumedKrw = totalQuantity * buyPrice;
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
      this.buyPrice = buyPrice;
      this.totalQuantity = totalQuantity;
      if (this.configService.get('RUN') === '1') {
        console.log('실제 상황 사자');
        this.run = true;
      } else {
        console.log('테스트 중 이라서 사지 않음');
        this.run = false;
      }
      await wait(1000 * 60 * 5);
    } else {
      console.log('nonono');
      if (this.configService.get('RUN') === '1') {
        console.log('실제 상황이지만 가성비 안 나옴');
        this.run = false;
      } else {
        console.log('테스트 중이고 가성비도 안 나옴');
        this.run = false;
      }
    }
  }
}
