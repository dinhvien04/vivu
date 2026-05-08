/** Client helpers for the Collections (Sổ tay) API. */
import type { Collection } from '@vivu/types';

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

export async function listMyCollections(bearer: string): Promise<Collection[]> {
  const r = await authedJson<{ data: Collection[] }>(
    '/api/me/collections',
    bearer,
    {},
    'Không tải được danh sách sổ tay',
  );
  return r.data;
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export async function createCollection(
  payload: CreateCollectionPayload,
  bearer: string,
): Promise<Collection> {
  const r = await authedJson<{ data: Collection }>(
    '/api/me/collections',
    bearer,
    { method: 'POST', body: payload },
    'Không tạo được sổ tay',
  );
  return r.data;
}

export async function getCollection(id: string, bearer: string): Promise<Collection> {
  const r = await authedJson<{ data: Collection }>(
    `/api/me/collections/${id}`,
    bearer,
    {},
    'Không tải được sổ tay',
  );
  return r.data;
}

export interface UpdateCollectionPayload {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export async function updateCollection(
  id: string,
  payload: UpdateCollectionPayload,
  bearer: string,
): Promise<Collection> {
  const r = await authedJson<{ data: Collection }>(
    `/api/me/collections/${id}`,
    bearer,
    { method: 'PATCH', body: payload },
    'Không lưu được thay đổi',
  );
  return r.data;
}

export async function deleteCollection(id: string, bearer: string): Promise<void> {
  await authedJson<void>(
    `/api/me/collections/${id}`,
    bearer,
    { method: 'DELETE' },
    'Không xoá được sổ tay',
  );
}

export async function addCollectionItem(
  collectionId: string,
  placeIdOrSlug: string,
  bearer: string,
  note?: string,
): Promise<Collection> {
  const body: { placeIdOrSlug: string; note?: string } = { placeIdOrSlug };
  if (note) body.note = note;
  const r = await authedJson<{ data: Collection }>(
    `/api/me/collections/${collectionId}/items`,
    bearer,
    { method: 'POST', body },
    'Không thêm được vào sổ tay',
  );
  return r.data;
}

export async function removeCollectionItem(
  collectionId: string,
  placeId: string,
  bearer: string,
): Promise<void> {
  await authedJson<void>(
    `/api/me/collections/${collectionId}/items/${placeId}`,
    bearer,
    { method: 'DELETE' },
    'Không bỏ được khỏi sổ tay',
  );
}
