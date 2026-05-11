/**
 * Controller test cho AuditLogsController. Override JwtAuthGuard + RolesGuard
 * để bypass auth — chỉ test logic delegate sang AuditLogsService.list().
 */
import { Test } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let service: { list: jest.Mock };

  beforeEach(async () => {
    service = { list: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [{ provide: AuditLogsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(AuditLogsController);
  });

  it('delegates to AuditLogsService.list with the query DTO as-is', async () => {
    const result = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    };
    service.list.mockResolvedValueOnce(result);
    const out = await controller.list({ page: 2, pageSize: 10 });
    expect(service.list).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    expect(out).toBe(result);
  });

  it('forwards an empty query object (service uses defaults)', async () => {
    service.list.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    });
    await controller.list({});
    expect(service.list).toHaveBeenCalledWith({});
  });

  it('returns the service result verbatim (no wrapping/reshaping)', async () => {
    const row = {
      id: 'log-1',
      actor: { id: 'u1', name: 'Trung', avatarUrl: null },
      action: 'place.update',
      entityType: 'Place',
      entityId: 'p1',
      metadata: null,
      createdAt: '2026-04-01T10:00:00.000Z',
    };
    const result = {
      data: [row],
      meta: { page: 1, pageSize: 20, total: 1 },
    };
    service.list.mockResolvedValueOnce(result);
    expect(await controller.list({ page: 1, pageSize: 20 })).toEqual(result);
  });

  it('propagates errors from the service', async () => {
    service.list.mockRejectedValueOnce(new Error('DB down'));
    await expect(controller.list({})).rejects.toThrow('DB down');
  });
});
