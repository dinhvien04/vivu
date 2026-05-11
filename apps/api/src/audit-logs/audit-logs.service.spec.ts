import { AuditLogsService } from './audit-logs.service';
import type { PrismaService } from '../prisma/prisma.service';

function makeRow(
  overrides: Partial<{
    id: string;
    actor: { id: string; name: string; avatarUrl: string | null } | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'log-1',
    actorId: overrides.actor?.id ?? 'u1',
    actor: overrides.actor ?? {
      id: 'u1',
      name: 'Trung',
      avatarUrl: 'https://cdn/avatar.png',
    },
    action: overrides.action ?? 'place.update',
    entityType: overrides.entityType ?? 'Place',
    entityId: overrides.entityId ?? 'p1',
    metadata: overrides.metadata ?? { foo: 'bar' },
    createdAt: overrides.createdAt ?? new Date('2026-04-01T10:00:00Z'),
    ...overrides,
  };
}

function build({ rows = [], total = 0 }: { rows?: ReturnType<typeof makeRow>[]; total?: number }) {
  const prisma = {
    auditLog: {
      create: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(total),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const service = new AuditLogsService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('AuditLogsService.record', () => {
  it('creates a row with all fields', async () => {
    const { service, prisma } = build({});
    await service.record({
      actorId: 'u1',
      action: 'place.delete',
      entityType: 'Place',
      entityId: 'p7',
      metadata: { reason: 'spam' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'u1',
        action: 'place.delete',
        entityType: 'Place',
        entityId: 'p7',
        metadata: { reason: 'spam' },
      },
    });
  });

  it('defaults entityId to null when omitted', async () => {
    const { service, prisma } = build({});
    await service.record({
      actorId: 'u1',
      action: 'auth.login',
      entityType: 'User',
    });
    const arg = prisma.auditLog.create.mock.calls[0][0];
    expect(arg.data.entityId).toBeNull();
  });

  it('accepts null actorId (system actions)', async () => {
    const { service, prisma } = build({});
    await service.record({
      actorId: null,
      action: 'system.snapshot',
      entityType: 'System',
    });
    const arg = prisma.auditLog.create.mock.calls[0][0];
    expect(arg.data.actorId).toBeNull();
  });

  it('does NOT throw when create fails (best-effort)', async () => {
    const { service, prisma } = build({});
    (prisma.auditLog.create as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      service.record({ actorId: 'u1', action: 'x', entityType: 'Y' }),
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('AuditLogsService.list', () => {
  it('returns default pagination (page=1, pageSize=20) when called with no args', async () => {
    const { service, prisma } = build({ rows: [], total: 0 });
    const out = await service.list();
    expect(out.meta).toEqual({ page: 1, pageSize: 20, total: 0 });
    const findManyArg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyArg.skip).toBe(0);
    expect(findManyArg.take).toBe(20);
  });

  it('applies skip = (page-1) × pageSize', async () => {
    const { service, prisma } = build({ rows: [], total: 100 });
    await service.list({ page: 3, pageSize: 25 });
    const findManyArg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyArg.skip).toBe(50);
    expect(findManyArg.take).toBe(25);
  });

  it('orders by createdAt desc', async () => {
    const { service, prisma } = build({ rows: [], total: 0 });
    await service.list();
    const findManyArg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyArg.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('includes actor projection', async () => {
    const { service, prisma } = build({ rows: [], total: 0 });
    await service.list();
    const findManyArg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(findManyArg.include).toEqual({
      actor: { select: { id: true, name: true, avatarUrl: true } },
    });
  });

  it('maps a row with an actor into the response shape (ISO timestamps)', async () => {
    const created = new Date('2026-04-01T10:00:00Z');
    const { service } = build({
      rows: [makeRow({ createdAt: created })],
      total: 1,
    });
    const out = await service.list({ page: 1, pageSize: 10 });
    expect(out.data).toEqual([
      {
        id: 'log-1',
        actor: { id: 'u1', name: 'Trung', avatarUrl: 'https://cdn/avatar.png' },
        action: 'place.update',
        entityType: 'Place',
        entityId: 'p1',
        metadata: { foo: 'bar' },
        createdAt: '2026-04-01T10:00:00.000Z',
      },
    ]);
  });

  it('maps a row with null actor (deleted user) to actor: null', async () => {
    const { service } = build({
      rows: [makeRow({ actor: null })],
      total: 1,
    });
    const out = await service.list();
    expect(out.data[0]?.actor).toBeNull();
  });

  it('maps null metadata to null on the response', async () => {
    const { service } = build({
      rows: [makeRow({ metadata: null })],
      total: 1,
    });
    const out = await service.list();
    expect(out.data[0]?.metadata).toBeNull();
  });

  it('returns total from prisma.count, not from rows.length', async () => {
    const { service } = build({
      rows: [makeRow(), makeRow({ id: 'log-2' })],
      total: 142,
    });
    const out = await service.list();
    expect(out.meta.total).toBe(142);
  });
});
