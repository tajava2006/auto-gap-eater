import { Module } from '@nestjs/common';
import { UpbitService } from './upbit.service';
import { UpbitController } from './upbit.controller';
import { HttpModule } from '@nestjs/axios';
import { UpbitApi } from './upbit.api';

@Module({
  imports: [HttpModule],
  controllers: [UpbitController],
  providers: [UpbitService, UpbitApi],
})
export class UpbitModule {}
