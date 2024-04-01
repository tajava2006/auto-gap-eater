import { Module } from '@nestjs/common';
import { BalanceManagementService } from './balance-management.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { BithumbModule } from 'src/bithumb/bithumb.module';
import { KrwDeposit } from './entities/krw-deposit.entity';
import { SelectPriceAmountService } from './select-price-amount.service';
import { UpbitModule } from 'src/upbit/upbit.module';
import { BuyAndTransferService } from './buy-and-transfer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserBalance, KrwDeposit]),
    BithumbModule,
    UpbitModule,
  ],
  controllers: [],
  providers: [
    BalanceManagementService,
    SelectPriceAmountService,
    BuyAndTransferService,
  ],
})
export class StrategyModule {}
