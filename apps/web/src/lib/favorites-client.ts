/** Browser-side helpers for the Favorites feature.
 *
 * Pattern matches `auth-client.ts`: client passes the bearer access token
 * obtained via `useAuth().getAccessToken()` to the Next.js route handlers
 * under `/api/places/:id/favorite` and `/api/me/favorites`, which proxy to
 * the NestJS API. */
import type { Place } from '@vivu/types';

interface FetchInit {
  method?: string;
  bearer: string;
}

async function call(path: string, init: FetchInit): Promise<Response> {
  return fetch(path, {
    method: init.method ?? 'GET',
    headers: { authorization: `Bearer ${init.bearer}` },
    cache: 'no-store',
  });
}

export async function getFavoriteStatus(placeId: string, bearer: string): Promise<boolean> {
  const res = await call(`/api/places/${placeId}/favorite`, { method: 'GET', bearer });
  if (!res.ok) return false;
  const data = (await res.json()) as { favorited?: boolean };
  return Boolean(data.favorited);
}

export async function addFavorite(placeId: string, bearer: string): Promise<void> {
  const res = await call(`/api/places/${placeId}/favorite`, { method: 'POST', bearer });
  if (!res.ok) {
    throw new Error(`Không thể thêm yêu thích (HTTP ${res.status})`);
  }
}

export async function removeFavorite(placeId: string, bearer: string): Promise<void> {
  const res = await call(`/api/places/${placeId}/favorite`, { method: 'DELETE', bearer });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Không thể bỏ yêu thích (HTTP ${res.status})`);
  }
}

export async function listMyFavorites(bearer: string): Promise<Place[]> {
  const res = await call('/api/me/favorites', { method: 'GET', bearer });
  if (!res.ok) {
    throw new Error(`Không tải được danh sách yêu thích (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { data: Place[] };
  return data.data;
}
