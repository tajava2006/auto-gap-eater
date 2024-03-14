import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BithumbModule } from './bithumb/bithumb.module';
import { UpbitModule } from './upbit/upbit.module';

@Module({
  imports: [BithumbModule, UpbitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
