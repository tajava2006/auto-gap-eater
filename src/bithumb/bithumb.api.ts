import request from 'request';
import { HmacSHA512 } from 'crypto-js';
import { encode } from 'base-64'; // 이 부분은 base64 인코딩을 위한 패키지를 임포트해야 합니다.

export class XCoinAPI {
  private apiUrl: string;
  private api_key: string;
  private api_secret: string;

  constructor(api_key: string, api_secret: string) {
    this.apiUrl = 'https://api.bithumb.com';
    this.api_key = api_key;
    this.api_secret = api_secret;
  }

  public async xcoinApiCall(endPoint: string, params?: any): Promise<any> {
    const rgParams: any = {
      endPoint: endPoint,
    };

    if (params) {
      for (const o in params) {
        rgParams[o] = params[o];
      }
    }

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
      form: rgParams,
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response) => {
        if (!error && response.statusCode == 200) {
          resolve(response);
        } else {
          reject(error);
        }
      });
    });
  }

  private _getHttpHeaders(
    endPoint: string,
    rgParams: any,
    api_key: string,
    api_secret: string,
  ): any {
    const strData = this.http_build_query(rgParams);
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

  private http_build_query(obj: any): string {
    const output_string: string[] = [];
    Object.keys(obj).forEach((val) => {
      let key = val;
      key = encodeURIComponent(key.replace(/[!'()*]/g, escape));

      if (typeof obj[val] === 'object') {
        const query = this.http_build_query(obj[val]);
        output_string.push(query);
      } else {
        const value = encodeURIComponent(obj[val].replace(/[!'()*]/g, escape));
        output_string.push(key + '=' + value);
      }
    });

    return output_string.join('&');
  }
}
