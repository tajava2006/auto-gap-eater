import { Module } from '@nestjs/common';
import { BalanceManagementService } from './balance-management.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { BithumbModule } from 'src/bithumb/bithumb.module';
import { KrwDeposit } from './entities/krw-deposit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBalance, KrwDeposit]), BithumbModule],
  controllers: [],
  providers: [BalanceManagementService],
})
export class StrategyModule {}
