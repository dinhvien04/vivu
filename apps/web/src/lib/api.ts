import type { Paginated, Place, Region, Category } from '@vivu/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PREFIX = '/api/v1';

interface FetchOptions {
  /** Cache mode for Next.js fetch. Defaults to short revalidation. */
  cache?: RequestCache;
  revalidate?: number | false;
}

async function get<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${BASE}${PREFIX}${path}`;
  const init: RequestInit & { next?: { revalidate?: number | false } } = {};
  if (opts.cache) init.cache = opts.cache;
  if (opts.revalidate !== undefined) init.next = { revalidate: opts.revalidate };

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface ListPlacesOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  /** Region slug, e.g. `mien-bac`. */
  region?: string;
}

export async function listPlaces(opts: ListPlacesOptions = {}): Promise<Paginated<Place>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
  if (opts.q) params.set('q', opts.q);
  if (opts.region) params.set('region', opts.region);
  const qs = params.toString();
  return get<Paginated<Place>>(`/places${qs ? `?${qs}` : ''}`, { revalidate: 60 });
}

export async function getPlaceBySlug(slug: string): Promise<Place> {
  const r = await get<{ data: Place }>(`/places/${slug}`, { revalidate: 60 });
  return r.data;
}

export type { Place, Region, Category, Paginated };
