import { Test, TestingModule } from '@nestjs/testing';
import { BithumbController } from './bithumb.controller';
import { BithumbService } from './bithumb.service';

describe('BithumbController', () => {
  let controller: BithumbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BithumbController],
      providers: [BithumbService],
    }).compile();

    controller = module.get<BithumbController>(BithumbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
