/**
 * Server-only helpers used by /app/api/auth/* route handlers.
 *
 * The pattern: Next.js route handlers proxy auth calls to the NestJS API.
 * The refresh token is stored in an httpOnly, sameSite=lax cookie set by us
 * (the browser never sees it via JS). The access token is returned to the
 * client in the JSON body and held in React memory only.
 */
import { cookies } from 'next/headers';

const REFRESH_COOKIE = 'vivu_refresh';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_PREFIX = '/api/v1';

export interface ApiAuthSuccess {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export async function callApi(
  path: string,
  init: { method?: string; body?: unknown; bearer?: string } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.bearer) headers.authorization = `Bearer ${init.bearer}`;
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    method: init.method ?? 'POST',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  let body: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  return { status: res.status, body };
}

export function setRefreshCookie(value: string): void {
  cookies().set({
    name: REFRESH_COOKIE,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: REFRESH_TTL_SECONDS,
  });
}

export function clearRefreshCookie(): void {
  cookies().set({
    name: REFRESH_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function readRefreshCookie(): string | null {
  return cookies().get(REFRESH_COOKIE)?.value ?? null;
}
