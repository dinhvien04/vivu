/** Minimal fetch response shape — avoids TS `Response` conflicts on Vercel/Nest builds. */
export interface FetchJsonResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export async function fetchJson(url: string, init?: RequestInit): Promise<FetchJsonResponse> {
  return (await fetch(url, init)) as unknown as FetchJsonResponse;
}
