/** Client helpers for the public /search endpoints. */

export interface SuggestPlace {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  address: string | null;
  heroImageUrl: string | null;
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

/**
 * Fetch typeahead suggestions. Returns an empty array when q is shorter
 * than 2 characters or the network call fails — callers don't need to
 * branch on errors for the dropdown UX.
 */
export async function getSuggest(
  q: string,
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<SuggestPlace[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const params = new URLSearchParams({ q: trimmed });
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  let res: Response;
  try {
    res = await fetch(`/api/search/suggest?${params.toString()}`, {
      cache: 'no-store',
      signal: options.signal,
    });
  } catch {
    return [];
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new Error(pickMessage(data, 'Không tải được gợi ý'));
  }
  const payload = data as { data?: SuggestPlace[] };
  return payload?.data ?? [];
}
