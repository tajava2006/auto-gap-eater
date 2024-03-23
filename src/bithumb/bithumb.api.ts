import { HmacSHA512 } from 'crypto-js';
import { encode } from 'base-64'; // 이 부분은 base64 인코딩을 위한 패키지를 임포트해야 합니다.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import qs from 'qs';

@Injectable()
export class XCoinAPIService {
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

  public async xcoinApiCall(
    endPoint: string,
    rgParams?: { [key: string]: string },
  ): Promise<any> {
    rgParams['endPoint'] = endPoint;

    const api_host = this.apiUrl + endPoint;
    const httpHeaders = this._getHttpHeaders(
      endPoint,
      rgParams,
      this.api_key,
      this.api_secret,
    );

    const options = {
      method: 'POST',
      url: api_host,
      headers: httpHeaders,
      data: qs.stringify(rgParams),
    };

    const res = await this.axios.axiosRef(options);
    return res.data;
  }

  private _getHttpHeaders(
    endPoint: string,
    rgParams: { [key: string]: string },
    api_key: string,
    api_secret: string,
  ): any {
    const strData = qs.stringify(rgParams);
    const nNonce = this.usecTime();
    return {
      'Api-Key': api_key,
      'Api-Sign': encode(
        HmacSHA512(
          endPoint + '\0' + strData + '\0' + nNonce,
          api_secret,
        ).toString(),
      ),
      'Api-Nonce': nNonce,
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  private usecTime(): number {
    const rgMicrotime = this.microtime().split(' ');
    let usec = rgMicrotime[0];
    const sec = rgMicrotime[1];

    usec = usec.substr(2, 3);
    return Number(String(sec) + String(usec));
  }

  private microtime() {
    const now = new Date().getTime() / 1000;
    const s = parseInt(now.toString(), 10);

    return Math.round((now - s) * 1000) / 1000 + ' ' + s;
  }
}
