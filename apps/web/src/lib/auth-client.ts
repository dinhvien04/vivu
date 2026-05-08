/** Browser-side auth helpers. All calls go to /api/auth/* (Next route handlers). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  bio?: string | null;
  location?: string | null;
  createdAt?: string;
}

export interface AuthStats {
  reviews: number;
  favorites: number;
  collections: number;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** Seconds until access token expires. */
  expiresIn: number;
}

interface ErrorPayload {
  message?: string | string[];
  statusCode?: number;
}

function pickMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const m = (payload as ErrorPayload).message;
    if (Array.isArray(m) && m.length > 0) return m[0]!;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body is OK */
  }
  if (!res.ok) {
    throw new AuthError(pickMessage(data, fallback), res.status);
  }
  return data as T;
}

export async function login(input: { email: string; password: string }): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/login', input, 'Đăng nhập thất bại');
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthSession> {
  return postJson<AuthSession>('/api/auth/register', input, 'Đăng ký thất bại');
}

export async function refresh(): Promise<{
  accessToken: string;
  expiresIn: number;
} | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as { accessToken: string; expiresIn: number };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}

export async function fetchMe(accessToken: string): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as AuthUser;
}

export async function forgotPassword(email: string): Promise<void> {
  await postJson<{ ok: true }>('/api/auth/forgot-password', { email }, 'Yêu cầu thất bại');
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await postJson<{ ok: true }>(
    '/api/auth/reset-password',
    { token, password },
    'Đặt lại mật khẩu thất bại',
  );
}

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
    cache: 'no-store',
  });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* */
    }
    throw new AuthError(pickMessage(data, 'Đổi mật khẩu thất bại'), res.status);
  }
}

export async function updateProfile(
  accessToken: string,
  patch: { name?: string; bio?: string; location?: string; avatarUrl?: string },
): Promise<AuthUser> {
  const res = await fetch('/api/auth/me', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(patch),
    cache: 'no-store',
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* */
  }
  if (!res.ok) {
    throw new AuthError(pickMessage(data, 'Cập nhật hồ sơ thất bại'), res.status);
  }
  return data as AuthUser;
}

export async function fetchStats(accessToken: string): Promise<AuthStats | null> {
  const res = await fetch('/api/auth/me/stats', {
    method: 'GET',
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as AuthStats;
}

export async function deleteAccount(accessToken: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/me', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
    cache: 'no-store',
  });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* */
    }
    throw new AuthError(pickMessage(data, 'Xoá tài khoản thất bại'), res.status);
  }
}
