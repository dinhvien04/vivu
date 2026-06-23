import type { Lead, LeadStatus, Paginated } from '@vivu/types';

export interface ListLeadsOptions {
  status?: LeadStatus | '';
  source?: string;
  q?: string;
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

export async function listAdminLeads(
  bearer: string,
  opts: ListLeadsOptions = {},
): Promise<Paginated<Lead>> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.source) params.set('source', opts.source);
  if (opts.q) params.set('q', opts.q);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));

  const res = await fetch(`/api/admin/leads${params.toString() ? `?${params}` : ''}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(pickMessage(payload, 'Khong tai duoc danh sach lead.'));
  return payload as Paginated<Lead>;
}

export async function updateLeadStatus(
  bearer: string,
  id: string,
  status: LeadStatus,
): Promise<Lead> {
  const res = await fetch(`/api/admin/leads/${id}/status`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(pickMessage(payload, 'Khong cap nhat duoc trang thai lead.'));
  const body = payload as { data?: Lead };
  if (!body.data) throw new Error('Khong cap nhat duoc trang thai lead.');
  return body.data;
}

export async function updateLeadNote(
  bearer: string,
  id: string,
  internalNote: string,
): Promise<Lead> {
  const res = await fetch(`/api/admin/leads/${id}/note`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ internalNote }),
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(pickMessage(payload, 'Khong luu duoc ghi chu lead.'));
  const body = payload as { data?: Lead };
  if (!body.data) throw new Error('Khong luu duoc ghi chu lead.');
  return body.data;
}
