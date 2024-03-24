import { Module } from '@nestjs/common';
import { BithumbService } from './bithumb.service';
import { BithumbController } from './bithumb.controller';
import { BithumbApi } from './bithumb.api';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [BithumbController],
  providers: [BithumbApi, BithumbService],
})
export class BithumbModule {}
