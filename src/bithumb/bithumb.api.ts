import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { GetNetworkInfoResponse } from './dto/get-network-info.dto';
import { GetBalanceResponse } from './dto/get-balance.dto';
import { GetOrderbookResponse } from './dto/get-orderbook.dto';
import { BuyResponse } from './dto/buy.dto';
import crypto from 'crypto';
import { symbolType } from 'src/util/symbol';

@Injectable()
export class BithumbApi {
  private apiUrl: string;
  private api_key: string;
  private api_secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly axios: HttpService,
  ) {
    this.apiUrl = 'https://api.bithumb.com';
    this.api_key = this.configService.get('BITHUMB_OPEN_API_ACCESS_KEY');
    this.api_secret = this.configService.get('BITHUMB_OPEN_API_SECRET_KEY');
  }

  // 입출금 현황
  public async getNetworkInfo(symbol: symbolType) {
    return this.xcoinApiCall<GetNetworkInfoResponse>(
      `/public/assetsstatus/multichain/${symbol}`,
      {},
      'GET',
    );
  }

  // 보유자산 조회
  public async getBalance(symbol: symbolType) {
    const balanceInfo = await this.xcoinApiCall<GetBalanceResponse>(
      '/info/balance',
      { currency: symbol },
      'POST',
    );
    if (balanceInfo.status !== '0000') return balanceInfo;
    const ret = {
      status: balanceInfo.status,
      data: {
        ...balanceInfo.data,
        total_coin: balanceInfo.data[`total_${symbol.toLowerCase()}`],
        in_use_coin: balanceInfo.data[`in_use_${symbol.toLowerCase()}`],
        available_coin: balanceInfo.data[`available_${symbol.toLowerCase()}`],
      },
    } as GetBalanceResponse;
    return ret;
  }

  // 코인 구매
  public async buy(symbol: symbolType, amount: string, price: string) {
    const buyResult = this.xcoinApiCall<BuyResponse>('/trade/place', {
      order_currency: symbol,
      payment_currency: 'KRW',
      units: amount,
      price: price,
      type: 'bid',
    });
    return buyResult;
  }

  // 코인 출금
  public async transfer(
    symbol: symbolType,
    amount: string,
    address: string,
    memo?: string,
  ) {
    const transferResult = this.xcoinApiCall('/trade/btc_withdrawal', {
      units: amount,
      address: address,
      destination: memo,
      currency: symbol,
      exchange_name: 'UPBIT',
      cust_type_cd: '01',
      ko_name: '서석민',
      en_name: 'SEOSUKMIN',
    });
    return transferResult;
  }

  // 코인호가 조회
  public async getOrderBook(symbol: symbolType) {
    return this.xcoinApiCall<GetOrderbookResponse>(
      `/public/orderbook/${symbol}_KRW?count=15`,
      {},
      'GET',
    );
  }

  private async xcoinApiCall<T>(
    endPoint: string,
    rqParams?: { [key: string]: string },
    method: string = 'POST',
  ): Promise<T> {
    rqParams['endPoint'] = endPoint;

    const api_host = this.apiUrl + endPoint;
    const httpHeaders = this.getHttpHeaders(
      endPoint,
      rqParams,
      this.api_key,
      this.api_secret,
    );

    const options: AxiosRequestConfig = {
      method,
      url: api_host,
      headers: httpHeaders,
      data: new URLSearchParams(rqParams).toString(),
    };

    try {
      const { data } = await firstValueFrom(
        this.axios.request<T>(options).pipe(
          catchError((err: AxiosError) => {
            throw err.response.data;
          }),
        ),
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  private getHttpHeaders(
    endPoint: string,
    rqParams: { [key: string]: string },
    api_key: string,
    api_secret: string,
  ): any {
    const strData = new URLSearchParams(rqParams).toString();
    const nNonce = this.usecTime();
    return {
      'Api-Key': api_key,
      'Api-Sign': Buffer.from(
        crypto
          .createHmac('sha512', api_secret)
          .update(endPoint + '\0' + strData + '\0' + nNonce)
          .digest('hex'),
      ).toString('base64'),
      'Api-Nonce': nNonce,
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  private usecTime(): number {
    const rgMicrotime = this.microtime().split(' ');
    let usec = rgMicrotime[0];
    const sec = rgMicrotime[1];

    usec = usec.substring(2, 5);
    return Number(String(sec) + String(usec));
  }

  private microtime() {
    const now = new Date().getTime() / 1000;
    const s = parseInt(now.toString(), 10);

    return Math.round((now - s) * 1000) / 1000 + ' ' + s;
  }
}
