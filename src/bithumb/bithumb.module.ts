import { Module } from '@nestjs/common';
import { BithumbService } from './bithumb.service';
import { BithumbController } from './bithumb.controller';
import { XCoinAPIService } from './bithumb.api';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [BithumbController],
  providers: [XCoinAPIService, BithumbService],
})
export class BithumbModule {}
