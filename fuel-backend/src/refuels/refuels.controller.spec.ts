import { Test, TestingModule } from '@nestjs/testing';
import { RefuelsController } from './refuels.controller';

describe('RefuelsController', () => {
  let controller: RefuelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefuelsController],
    }).compile();

    controller = module.get<RefuelsController>(RefuelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
