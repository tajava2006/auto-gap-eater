import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import * as crypto from 'crypto';
@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getHello(): string {
    return 'Hello World!';
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

  async githubWebhooks(req, res) {
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
    return 'ok';
  }
}
