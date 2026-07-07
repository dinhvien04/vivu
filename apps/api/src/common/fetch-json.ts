/** Minimal fetch response shape — avoids TS `Response` conflicts on Vercel/Nest builds. */
export interface FetchJsonResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export class FetchTimeoutError extends Error {
  constructor(
    readonly url: string,
    readonly timeoutMs: number,
  ) {
    super(`Fetch timed out after ${timeoutMs}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export async function fetchJson(url: string, init?: FetchJsonOptions): Promise<FetchJsonResponse> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...requestInit } = init ?? {};
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal ? AbortSignal.any([callerSignal, timeoutSignal]) : timeoutSignal;

  try {
    return (await fetch(url, { ...requestInit, signal })) as unknown as FetchJsonResponse;
  } catch (error) {
    if (isAbortTimeoutError(error, timeoutSignal)) {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw error;
  }
}

function isAbortTimeoutError(error: unknown, timeoutSignal: AbortSignal): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return timeoutSignal.aborted;
  }
  return false;
}
