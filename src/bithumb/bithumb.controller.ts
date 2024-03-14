import { Controller } from '@nestjs/common';
import { BithumbService } from './bithumb.service';

@Controller('bithumb')
export class BithumbController {
  constructor(private readonly bithumbService: BithumbService) {}
}
