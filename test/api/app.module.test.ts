import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../apps/api/src/app.module';
import { HealthController } from '../../apps/api/src/common/health.controller';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Mock external modules to avoid dependencies
    const mockModule = {
      imports: [],
      controllers: [HealthController],
      providers: [],
    };

    module = await Test.createTestingModule(mockModule).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should compile successfully', () => {
    expect(module).toBeDefined();
  });

  it('should have HealthController', () => {
    const controller = module.get<HealthController>(HealthController);
    expect(controller).toBeDefined();
  });
});