import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBalance } from './entities/user-balance.entity';
import { BithumbModule } from 'src/bithumb/bithumb.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserBalance]), BithumbModule],
  controllers: [],
  providers: [StrategyService],
})
export class StrategyModule {}
