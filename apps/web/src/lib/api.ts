import type { Paginated, Place } from '@vivu/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchPlaces(
  params: {
    q?: string;
    region?: string;
    category?: string;
    page?: number;
  } = {},
): Promise<Paginated<Place>> {
  const url = new URL('/api/v1/places', API_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch places: ${res.status}`);
  return (await res.json()) as Paginated<Place>;
}
