/** Browser-side helpers for the Admin Places CRUD endpoints. All calls hit
 * the Next.js route handlers under /api/admin/places/* which proxy to the
 * NestJS API and forward the bearer access token. */
import type { Paginated, Place } from '@vivu/types';

interface FetchInit {
  method?: string;
  bearer: string;
  body?: unknown;
}

async function call<T>(path: string, init: FetchInit, fallback: string): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${init.bearer}`,
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    const msg = pickMessage(data, fallback);
    throw new Error(msg);
  }
  return data as T;
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

export interface AdminListPlacesOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  region?: string;
  hasGeo?: boolean;
  hasHeroImage?: boolean;
}

export async function adminListPlaces(
  bearer: string,
  opts: AdminListPlacesOptions = {},
): Promise<Paginated<Place>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
  if (opts.q) params.set('q', opts.q);
  if (opts.region) params.set('region', opts.region);
  if (opts.hasGeo !== undefined) params.set('hasGeo', String(opts.hasGeo));
  if (opts.hasHeroImage !== undefined) params.set('hasHeroImage', String(opts.hasHeroImage));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return call<Paginated<Place>>(
    `/api/admin/places${qs}`,
    { method: 'GET', bearer },
    'Không tải được danh sách',
  );
}

export async function adminGetPlace(slug: string, bearer: string): Promise<Place> {
  const r = await call<{ data: Place }>(
    `/api/admin/places/${slug}`,
    { method: 'GET', bearer },
    'Không tìm thấy địa điểm',
  );
  return r.data;
}

export interface PlacePayload {
  slug: string;
  titleVi: string;
  titleEn?: string;
  summaryVi?: string;
  summaryEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  regionId: string;
  address?: string;
  geo?: { lat: number; lng: number };
  bestSeasons?: string[];
  status?: 'draft' | 'published' | 'archived';
  heroImageUrl?: string;
  categoryIds?: string[];
}

export type PlaceUpdatePayload = Partial<PlacePayload>;

export async function adminCreatePlace(payload: PlacePayload, bearer: string): Promise<Place> {
  const r = await call<{ data: Place }>(
    '/api/admin/places',
    { method: 'POST', bearer, body: payload },
    'Không tạo được địa điểm',
  );
  return r.data;
}

export async function adminUpdatePlace(
  id: string,
  payload: PlaceUpdatePayload,
  bearer: string,
): Promise<Place> {
  const r = await call<{ data: Place }>(
    `/api/admin/places/${id}`,
    { method: 'PATCH', bearer, body: payload },
    'Không lưu được thay đổi',
  );
  return r.data;
}

export async function adminDeletePlace(id: string, bearer: string): Promise<void> {
  await call<void>(
    `/api/admin/places/${id}`,
    { method: 'DELETE', bearer },
    'Không xoá được địa điểm',
  );
}

export async function adminPublishPlace(id: string, bearer: string): Promise<Place> {
  const r = await call<{ data: Place }>(
    `/api/admin/places/${id}/publish`,
    { method: 'POST', bearer },
    'Không xuất bản được',
  );
  return r.data;
}

export async function adminUnpublishPlace(id: string, bearer: string): Promise<Place> {
  const r = await call<{ data: Place }>(
    `/api/admin/places/${id}/unpublish`,
    { method: 'POST', bearer },
    'Không hủy xuất bản được',
  );
  return r.data;
}
