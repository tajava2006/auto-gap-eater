import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { StrategyModule } from './strategy/strategy.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBalance } from './strategy/entities/user-balance.entity';
import { KrwDeposit } from './strategy/entities/krw-deposit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${__dirname}/config/.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [UserBalance, KrwDeposit],
      synchronize: true, //development only
    }),
    ScheduleModule.forRoot(),
    StrategyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
