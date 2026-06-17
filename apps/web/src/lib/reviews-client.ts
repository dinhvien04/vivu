/** Client helpers for the Reviews API. */
import type { Paginated, Review } from '@vivu/types';
import { getPublicApiBase } from './api-base';

const BASE = getPublicApiBase();

function publicReviewsUrl(slug: string, qs: string): string {
  const path = `/api/places/${slug}/reviews${qs}`;
  if (typeof window !== 'undefined') return path;
  return `${BASE}/api/v1/places/${slug}/reviews${qs}`;
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

async function authedJson<T>(
  path: string,
  bearer: string,
  init: { method?: string; body?: unknown } = {},
  fallback = 'Có lỗi xảy ra',
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${bearer}`,
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
    /* ignore */
  }
  if (!res.ok) throw new Error(pickMessage(data, fallback));
  return data as T;
}

/** Public list — server-side via the NestJS API directly. */
export async function listReviewsForPlace(
  slug: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<Paginated<Review>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(publicReviewsUrl(slug, qs), {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`API /places/${slug}/reviews → ${res.status}`);
  return (await res.json()) as Paginated<Review>;
}

export interface CreateReviewPayload {
  rating: number;
  content: string;
}

export async function createReview(
  placeIdOrSlug: string,
  payload: CreateReviewPayload,
  bearer: string,
): Promise<Review> {
  const r = await authedJson<{ data: Review }>(
    `/api/places/${placeIdOrSlug}/reviews`,
    bearer,
    { method: 'POST', body: payload },
    'Không gửi được đánh giá',
  );
  return r.data;
}

export async function updateReview(
  reviewId: string,
  payload: Partial<CreateReviewPayload>,
  bearer: string,
): Promise<Review> {
  const r = await authedJson<{ data: Review }>(
    `/api/reviews/${reviewId}`,
    bearer,
    { method: 'PATCH', body: payload },
    'Không lưu được đánh giá',
  );
  return r.data;
}

export async function deleteReview(reviewId: string, bearer: string): Promise<void> {
  await authedJson<void>(
    `/api/reviews/${reviewId}`,
    bearer,
    { method: 'DELETE' },
    'Không xoá được đánh giá',
  );
}

export async function listMyReviews(
  bearer: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<Paginated<Review>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return authedJson<Paginated<Review>>(
    `/api/me/reviews${qs}`,
    bearer,
    {},
    'Không tải được danh sách đánh giá của bạn',
  );
}

/** Admin helpers. */
export interface AdminListReviewsOptions {
  page?: number;
  pageSize?: number;
  status?: 'visible' | 'hidden' | 'reported';
}

export async function adminListReviews(
  bearer: string,
  options: AdminListReviewsOptions = {},
): Promise<Paginated<Review>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.status) params.set('status', options.status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return authedJson<Paginated<Review>>(
    `/api/admin/reviews${qs}`,
    bearer,
    {},
    'Không tải được danh sách đánh giá',
  );
}

export async function adminHideReview(reviewId: string, bearer: string): Promise<Review> {
  const r = await authedJson<{ data: Review }>(
    `/api/admin/reviews/${reviewId}/hide`,
    bearer,
    { method: 'POST' },
    'Không ẩn được đánh giá',
  );
  return r.data;
}

export async function adminRestoreReview(reviewId: string, bearer: string): Promise<Review> {
  const r = await authedJson<{ data: Review }>(
    `/api/admin/reviews/${reviewId}/restore`,
    bearer,
    { method: 'POST' },
    'Không khôi phục được đánh giá',
  );
  return r.data;
}
