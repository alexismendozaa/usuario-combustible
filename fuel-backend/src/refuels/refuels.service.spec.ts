import { Test, TestingModule } from '@nestjs/testing';
import { RefuelsService } from './refuels.service';

describe('RefuelsService', () => {
  let service: RefuelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefuelsService],
    }).compile();

    service = module.get<RefuelsService>(RefuelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
