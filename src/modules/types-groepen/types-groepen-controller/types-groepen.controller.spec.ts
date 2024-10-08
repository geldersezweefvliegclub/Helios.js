import { Test, TestingModule } from '@nestjs/testing';
import { TypesGroepenController } from './types-groepen.controller';

describe('TypesGroepenControllerController', () => {
  let controller: TypesGroepenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypesGroepenController],
    }).compile();

    controller = module.get<TypesGroepenController>(TypesGroepenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
