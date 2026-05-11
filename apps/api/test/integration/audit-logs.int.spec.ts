/**
 * Integration test cho `AuditLogsService` — verify cả write path (`record`) và
 * read path (`list`) với DB thật:
 *
 * - Bảng `AuditLog` có FK `actorId -> User.id` (nullable, ON DELETE SET NULL).
 * - JSON column `metadata` (Prisma.InputJsonValue).
 * - `list()` join sang `User` để trả actor info.
 * - `record()` best-effort: nuốt lỗi (vd FK violation) — verify rằng promise
 *   resolve, không throw.
 */
import { AuditLogsService } from '../../src/audit-logs/audit-logs.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { disconnectPrisma, getPrisma, truncateAll } from './prisma-helper';

describe('AuditLogsService — integration', () => {
  let prisma: PrismaService;
  let service: AuditLogsService;
  let adminUserId: string;

  beforeAll(async () => {
    prisma = getPrisma() as PrismaService;
    service = new AuditLogsService(prisma);
  });

  beforeEach(async () => {
    await truncateAll();
    const u = await prisma.user.create({
      data: {
        email: 'admin@vivu.test',
        passwordHash: 'x',
        name: 'Admin',
        role: 'admin',
      },
    });
    adminUserId = u.id;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('record() lưu row, list() trả về với actor đầy đủ + metadata JSON', async () => {
    await service.record({
      actorId: adminUserId,
      action: 'place.update',
      entityType: 'Place',
      entityId: 'p1',
      metadata: { before: 'draft', after: 'published' },
    });

    const out = await service.list();
    expect(out.meta.total).toBe(1);
    expect(out.data[0]).toMatchObject({
      action: 'place.update',
      entityType: 'Place',
      entityId: 'p1',
      metadata: { before: 'draft', after: 'published' },
      actor: { id: adminUserId, name: 'Admin', avatarUrl: null },
    });
    expect(out.data[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('record() với actorId=null tạo row hệ thống (actor=null trong list)', async () => {
    await service.record({
      actorId: null,
      action: 'cron.reindex',
      entityType: 'System',
    });
    const out = await service.list();
    expect(out.data[0]?.actor).toBeNull();
  });

  it('list() sort theo createdAt DESC', async () => {
    await service.record({ actorId: adminUserId, action: 'a1', entityType: 'X' });
    await new Promise((r) => setTimeout(r, 10));
    await service.record({ actorId: adminUserId, action: 'a2', entityType: 'X' });
    await new Promise((r) => setTimeout(r, 10));
    await service.record({ actorId: adminUserId, action: 'a3', entityType: 'X' });

    const out = await service.list();
    expect(out.data.map((r) => r.action)).toEqual(['a3', 'a2', 'a1']);
  });

  it('list() pagination: page=2, pageSize=2 trả đúng 2 row cũ hơn', async () => {
    for (let i = 1; i <= 5; i++) {
      await service.record({ actorId: adminUserId, action: `act-${i}`, entityType: 'X' });
      await new Promise((r) => setTimeout(r, 5));
    }
    const page2 = await service.list({ page: 2, pageSize: 2 });
    expect(page2.meta).toEqual({ page: 2, pageSize: 2, total: 5 });
    // page 1 = [act-5, act-4]; page 2 = [act-3, act-2].
    expect(page2.data.map((r) => r.action)).toEqual(['act-3', 'act-2']);
  });

  it('record() best-effort: actorId không tồn tại → swallow (không throw), không tạo row', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      service.record({
        actorId: 'user-does-not-exist',
        action: 'broken',
        entityType: 'X',
      }),
    ).resolves.toBeUndefined();

    const out = await service.list();
    expect(out.data).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('khi actor bị xoá sau audit log, list() vẫn trả row với actor=null (ON DELETE SET NULL)', async () => {
    await service.record({ actorId: adminUserId, action: 'pre-delete', entityType: 'X' });
    await prisma.user.delete({ where: { id: adminUserId } });
    const out = await service.list();
    expect(out.meta.total).toBe(1);
    expect(out.data[0]?.actor).toBeNull();
  });
});
