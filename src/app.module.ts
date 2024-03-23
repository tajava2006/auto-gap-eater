import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BithumbModule } from './bithumb/bithumb.module';
import { UpbitModule } from './upbit/upbit.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${__dirname}/config/.env.${process.env.NODE_ENV}`,
    }),
    BithumbModule,
    UpbitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
