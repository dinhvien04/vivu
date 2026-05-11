import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  id: string;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListAuditLogsOptions {
  page?: number;
  pageSize?: number;
}

export interface ListAuditLogsResult {
  data: AuditLogEntry[];
  meta: { page: number; pageSize: number; total: number };
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a single audit log row. Failures are swallowed and logged via the
   * default logger — auditing must never break the underlying admin action.
   */
  async record(input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          metadata: input.metadata,
        },
      });
    } catch (e) {
      // Best-effort: log and move on.
      console.error('[audit] failed to record', input.action, e);
    }
  }

  async list(options: ListAuditLogsOptions = {}): Promise<ListAuditLogsResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        actor: r.actor
          ? { id: r.actor.id, name: r.actor.name, avatarUrl: r.actor.avatarUrl ?? null }
          : null,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        metadata: (r.metadata as Record<string, unknown> | null) ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page, pageSize, total },
    };
  }
}
