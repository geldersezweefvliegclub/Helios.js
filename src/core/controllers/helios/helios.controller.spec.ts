import { Test, TestingModule } from '@nestjs/testing';
import { HeliosController } from './helios.controller';

describe('HeliosController', () => {
  let controller: HeliosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeliosController],
    }).compile();

    controller = module.get<HeliosController>(HeliosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
