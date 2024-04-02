import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  verify_signature = (req: Request) => {
    const WEBHOOK_SECRET = this.configService.get('WEBHOOK_SECRET');
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    const untrusted = Buffer.from(req.headers['x-hub-signature-256'], 'ascii');
    return crypto.timingSafeEqual(trusted, untrusted);
  };

  @Post('/github-webhooks')
  async githubWebhooks(@Body() body, @Res() res, @Req() req) {
    // Git에서 코드 풀하기
    if (!this.verify_signature(req)) {
      res.status(401).send('Unauthorized');
      return;
    }
    exec('git pull', (err) => {
      if (err) {
        console.error(`Git pull error: ${err}`);
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Error updating codebase');
      }

      // PM2 서비스 다시 시작
      exec(`pm2 restart ${process.env.NODE_ENV}`, (err) => {
        if (err) {
          console.error(`PM2 restart error: ${err}`);
          return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send('Error restarting service');
        }
        console.log('Codebase updated and service restarted successfully');
        res
          .status(HttpStatus.OK)
          .send('Codebase updated and service restarted successfully');
      });
    });
    return body;
  }
}
