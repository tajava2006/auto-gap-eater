import { Injectable } from '@nestjs/common';
import { BithumbApi } from 'src/bithumb/bithumb.api';
import { Cron } from '@nestjs/schedule';
import { SelectPriceAmountService } from './select-price-amount.service';
import wait from 'src/util/wait';
import { symbolMap, symbolType } from 'src/util/symbol';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BuyAndTransferService {
  private running = false;
  constructor(
    private readonly bithumb: BithumbApi,
    private readonly selectPriceAmountService: SelectPriceAmountService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('* * * * * *')
  private async buy() {
    if (this.running) {
      console.log('너무 자주 매수 하지 마');
      return;
    }
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');
    const strategy = this.selectPriceAmountService.canRun();
    console.log('buy service :', strategy);
    if (!strategy.run) return;

    try {
      this.running = true;
      const buyReceipt = await this.bithumb.buy(
        symbol,
        String(Math.floor(strategy.totalQuantity)),
        String(strategy.buyPrice),
      );
      console.log('빗썸 매수 요청 영수증 : ', buyReceipt);
    } catch (err) {
      console.log('buy 함수 에러');
    } finally {
      await wait(1000 * 60 * 2);
      this.running = false;
    }
  }

  @Cron('* * * * * *')
  private async cancel() {
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');

    try {
      const pendingOrder = await this.bithumb.getMyPendingOrder(symbol);
      if (pendingOrder.status === '0000') {
        for (const row of pendingOrder.data) {
          this.bithumb.cancelOrder(symbol, row.order_id);
          console.log('팬딩 주문 취소(확인은 안 함) : ', row.order_id);
        }
      }
    } catch (err) {
      console.log('주문 취소 함수 에러');
    }
  }

  @Cron('* * * * * *')
  private async transfer() {
    const symbol: symbolType = this.configService.get('SYMBOL_TO_RUN');
    const amount = await this.bithumb.getBalance(symbol);
    try {
      const transferAmount = String(
        Number(amount.data.available_coin) - symbolMap.get(symbol).fee,
      );
      const address = symbolMap.get(symbol).address;
      const memo = symbolMap.get(symbol).memo;
      // todo magic number 없앨 것. 현재 대략 개당 천원 잡고 오백만원 이상이면 전송
      if (Number(transferAmount) > 10) {
        console.log('코인 업비트로 출금!!');
        const transfer = await this.bithumb.transfer(
          symbol,
          transferAmount,
          address,
          memo,
        );
        console.log('전송 영수증 :', transfer);
      } else {
        console.log('코인 전송 대기 중 : ', amount.data.available_coin);
      }
    } catch (err) {
      console.log('transfer 함수 에러');
    }
  }
}
