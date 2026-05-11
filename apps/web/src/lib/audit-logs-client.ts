/** Client helpers for the Admin AuditLogs endpoint. */

export interface AuditLogActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor: AuditLogActor | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogList {
  data: AuditLogEntry[];
  meta: { page: number; pageSize: number; total: number };
}

interface ErrorPayload {
  message?: string | string[];
}

function pickMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const m = (payload as ErrorPayload).message;
    if (Array.isArray(m) && m.length > 0) return m[0]!;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

export async function listAuditLogs(
  bearer: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<AuditLogList> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.set('page', String(options.page));
  if (options.pageSize !== undefined) params.set('pageSize', String(options.pageSize));
  const qs = params.toString();
  const res = await fetch(`/api/admin/audit-logs${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new Error(pickMessage(data, 'Không tải được nhật ký hoạt động'));
  }
  const payload = data as AuditLogList | null;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('Không tải được nhật ký hoạt động');
  }
  return payload;
}
