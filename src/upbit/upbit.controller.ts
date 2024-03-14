import { Controller } from '@nestjs/common';
import { UpbitService } from './upbit.service';

@Controller('upbit')
export class UpbitController {
  constructor(private readonly upbitService: UpbitService) {}
}
