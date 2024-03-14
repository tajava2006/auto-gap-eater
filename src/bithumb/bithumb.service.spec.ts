import { Test, TestingModule } from '@nestjs/testing';
import { BithumbService } from './bithumb.service';

describe('BithumbService', () => {
  let service: BithumbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BithumbService],
    }).compile();

    service = module.get<BithumbService>(BithumbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
