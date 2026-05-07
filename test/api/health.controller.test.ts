import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../apps/api/src/common/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('healthz', () => {
    it('should return status ok', () => {
      const result = controller.healthz();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readyz', () => {
    it('should return status ready', () => {
      const result = controller.readyz();
      expect(result).toEqual({ status: 'ready' });
    });
  });
});