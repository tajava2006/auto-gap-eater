import { Module } from '@nestjs/common';
import { UpbitService } from './upbit.service';
import { HttpModule } from '@nestjs/axios';
import { UpbitApi } from './upbit.api';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [UpbitService, UpbitApi],
})
export class UpbitModule {}
