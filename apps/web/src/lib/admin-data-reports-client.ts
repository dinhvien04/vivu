import type { DataReport, DataReportStatus, DataReportType, Paginated } from '@vivu/types';

export interface ListDataReportsOptions {
  status?: DataReportStatus | '';
  type?: DataReportType | '';
  placeSlug?: string;
  page?: number;
  pageSize?: number;
}

interface ErrorPayload {
  message?: string | string[];
}

function pickMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = (payload as ErrorPayload).message;
    if (Array.isArray(message) && message.length > 0) return message[0]!;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function listAdminDataReports(
  bearer: string,
  opts: ListDataReportsOptions = {},
): Promise<Paginated<DataReport>> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.type) params.set('type', opts.type);
  if (opts.placeSlug) params.set('placeSlug', opts.placeSlug);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));

  const res = await fetch(`/api/admin/data-reports${params.toString() ? `?${params}` : ''}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(pickMessage(payload, 'Khong tai duoc danh sach bao loi.'));
  return payload as Paginated<DataReport>;
}

export async function updateDataReportStatus(
  bearer: string,
  id: string,
  status: DataReportStatus,
): Promise<DataReport> {
  const res = await fetch(`/api/admin/data-reports/${id}/status`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(pickMessage(payload, 'Khong cap nhat duoc trang thai bao loi.'));
  const body = payload as { data?: DataReport };
  if (!body.data) throw new Error('Khong cap nhat duoc trang thai bao loi.');
  return body.data;
}
