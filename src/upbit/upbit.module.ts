import { Module } from '@nestjs/common';
import { UpbitService } from './upbit.service';
import { UpbitController } from './upbit.controller';

@Module({
  controllers: [UpbitController],
  providers: [UpbitService],
})
export class UpbitModule {}
