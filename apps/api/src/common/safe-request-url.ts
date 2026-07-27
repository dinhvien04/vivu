const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'code',
  'state',
  'access_token',
  'refresh_token',
  'password',
]);

/** Pathname only — safe for error/access logs. */
export function pathnameOnly(url: string): string {
  return url.split('?')[0] || '/';
}

/** Pathname with sensitive query values redacted (for optional debug logging). */
export function safeRequestUrl(url: string): string {
  const [pathname, queryString] = url.split('?');
  if (!queryString) return pathname || '/';

  const params = new URLSearchParams(queryString);
  for (const key of params.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      params.set(key, '[REDACTED]');
    }
  }
  const redacted = params.toString();
  return redacted ? `${pathname}?${redacted}` : pathname || '/';
}
