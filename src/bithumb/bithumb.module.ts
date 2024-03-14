import { Module } from '@nestjs/common';
import { BithumbService } from './bithumb.service';
import { BithumbController } from './bithumb.controller';

@Module({
  controllers: [BithumbController],
  providers: [BithumbService],
})
export class BithumbModule {}
