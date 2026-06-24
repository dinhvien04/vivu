/**
 * Controller test cho AdminStatsController. Override JwtAuthGuard + RolesGuard
 * để bypass auth — chỉ test logic delegate + bọc response `{ data }`.
 */
import { Test } from '@nestjs/testing';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService, type AdminStats } from './admin-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AdminStatsController', () => {
  let controller: AdminStatsController;
  let service: { snapshot: jest.Mock };

  function makeSnapshot(overrides: Partial<AdminStats> = {}): AdminStats {
    return {
      totalPlaces: 0,
      totalReviews: 0,
      activeUsers: 0,
      computedAt: new Date().toISOString(),
      totalTripPlans: 0,
      totalLeads: 0,
      aiRequestsToday: 0,
      tripPlansToday: 0,
      newLeads: 0,
      planningLeads: 0,
      newDataReports: 0,
      resolvedDataReports7d: 0,
      aiFeedbackIssues: 0,
      missingContextEvents: 0,
      leadsByStatus: [],
      topPlacesViewed: [],
      topLeadPlaces: [],
      topSearchQueries: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    service = { snapshot: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminStatsController],
      providers: [{ provide: AdminStatsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(AdminStatsController);
  });

  it('delegates to AdminStatsService.snapshot()', async () => {
    const snap = makeSnapshot();
    service.snapshot.mockResolvedValueOnce(snap);
    await controller.snapshot();
    expect(service.snapshot).toHaveBeenCalledTimes(1);
    expect(service.snapshot).toHaveBeenCalledWith();
  });

  it('wraps result in `{ data }`', async () => {
    const snap = makeSnapshot({
      totalPlaces: 42,
      totalReviews: 100,
      activeUsers: 17,
      computedAt: '2026-05-01T00:00:00.000Z',
      totalTripPlans: 9,
      totalLeads: 4,
    });
    service.snapshot.mockResolvedValueOnce(snap);
    expect(await controller.snapshot()).toEqual({ data: snap });
  });

  it('propagates errors from the service', async () => {
    service.snapshot.mockRejectedValueOnce(new Error('snapshot failed'));
    await expect(controller.snapshot()).rejects.toThrow('snapshot failed');
  });
});
