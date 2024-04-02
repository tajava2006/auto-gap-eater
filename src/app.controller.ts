import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { exec } from 'child_process';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/github-webhooks')
  async githubWebhooks(@Body() body, @Res() res) {
    console.log('body :', body);
    // Git에서 코드 풀하기
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
