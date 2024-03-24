import { Module } from '@nestjs/common';
import { BithumbService } from './bithumb.service';
import { BithumbApi } from './bithumb.api';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [BithumbApi, BithumbService],
  exports: [BithumbApi],
})
export class BithumbModule {}
