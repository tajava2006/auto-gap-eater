import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { sign } from 'jsonwebtoken';
import { catchError, firstValueFrom } from 'rxjs';
import { GetBalanceResponse } from './dto/get-account-balance.dto';
import { GetOrderbookResponse } from './dto/get-orderbook-dto';
import { symbolType } from 'src/util/symbol';

@Injectable()
export class UpbitApi {
  private server_url: string;
  private access_key: string;
  private secret_key: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly axios: HttpService,
  ) {
    this.server_url = 'https://api.upbit.com/';
    this.access_key = this.configService.get('UPBIT_OPEN_API_ACCESS_KEY');
    this.secret_key = this.configService.get('UPBIT_OPEN_API_SECRET_KEY');
  }

  // 주문가능 정보. 새로운 심볼 시험해볼 때만 한번 되는지 선확인 필요
  async getOrdersChange(symbol: symbolType) {
    return this.upbitApiCall(
      `/v1/orders/chance?market=KRW-${symbol}`,
      { market: `KRW-${symbol.toUpperCase()}` },
      'GET',
    );
  }

  // 잔고 조회
  async getBalance(symbol: symbolType) {
    const ret = await this.upbitApiCall<GetBalanceResponse>(
      '/v1/accounts',
      {},
      'GET',
    );
    if (symbol) {
      return ret.filter((x) => x.currency === symbol);
    }
    return ret;
  }

  // 호가 조회
  async getOrderbook(symbol: symbolType) {
    const ret = await this.upbitApiCall<GetOrderbookResponse>(
      `/v1/orderbook?markets=KRW-${symbol}`,
      {},
      'GET',
    );
    return ret;
  }

  // 팔기
  async sell(volume: string, symbol: symbolType) {
    console.log('sell : ', volume, symbol);
    const ret = await this.upbitApiCall(`/v1/orders`, {
      market: `KRW-${symbol}`,
      side: 'ask',
      volume,
      ord_type: 'market',
    });
    return ret;
  }

  // 원화 출금
  async withdraws(amount: string) {
    const ret = await this.upbitApiCall(`/v1/withdraws/krw`, {
      amount: String(parseInt(amount)),
      two_factor_type: 'kakao',
    });
    return ret;
  }

  private async upbitApiCall<T>(
    endPoint: string,
    body: { [key: string]: string },
    method: string = 'POST',
  ): Promise<T> {
    const query = new URLSearchParams(body).toString();
    // const query = encode(body);
    const hash = crypto.createHash('sha512');
    const queryHash = hash.update(query, 'utf-8').digest('hex');

    const payload = {
      access_key: this.access_key,
      nonce: crypto.randomUUID(),
      query_hash: queryHash,
      query_hash_alg: 'SHA512',
    };

    const token = sign(payload, this.secret_key);

    const options: AxiosRequestConfig = {
      method,
      url: this.server_url + endPoint,
      headers: {
        Authorization: `Bearer ${token}`,
        'content-Type': 'application/json',
      },
      data: body,
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
}
