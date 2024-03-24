import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UpbitApi {
  private apiUrl: string;
  private api_key: string;
  private api_secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly axios: HttpService,
  ) {
    this.apiUrl = 'https://api.upbit.com/';
    this.api_key = this.configService.get('UPBIT_OPEN_API_ACCESS_KEY');
    this.api_secret = this.configService.get('UPBIT_OPEN_API_SECRET_KEY');
  }
}
