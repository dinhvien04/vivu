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

export type PlaceSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type PlaceSort = 'recent' | 'name';

export interface ListPlacesOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  /** Region slug, e.g. `mien-bac`. */
  region?: string;
  /** Category slug, e.g. `bien-dao`. */
  category?: string;
  /** Best season slug, e.g. `summer`. */
  season?: PlaceSeason;
  /** Sort mode: `recent` (default — by updatedAt desc) or `name` (asc). */
  sort?: PlaceSort;
  /** Minimum average rating (1.0 — 5.0). */
  minRating?: number;
}

export async function listPlaces(opts: ListPlacesOptions = {}): Promise<Paginated<Place>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
  if (opts.q) params.set('q', opts.q);
  if (opts.region) params.set('region', opts.region);
  if (opts.category) params.set('category', opts.category);
  if (opts.season) params.set('season', opts.season);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.minRating !== undefined) params.set('minRating', String(opts.minRating));
  const qs = params.toString();
  return get<Paginated<Place>>(`/places${qs ? `?${qs}` : ''}`, { revalidate: 60 });
}

export async function getPlaceBySlug(slug: string): Promise<Place> {
  const r = await get<{ data: Place }>(`/places/${slug}`, { revalidate: 60 });
  return r.data;
}

export async function listRegions(): Promise<Region[]> {
  const r = await get<{ data: Region[] }>('/regions', { revalidate: 300 });
  return r.data;
}

export async function listCategories(): Promise<Category[]> {
  const r = await get<{ data: Category[] }>('/categories', { revalidate: 300 });
  return r.data;
}

export type { Place, Region, Category, Paginated };
