/**
 * Restricts post-auth redirects to same-site relative paths.
 * Rejects protocol-relative URLs, absolute URLs, and backslash tricks.
 */
export function sanitizeRelativePath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }
  if (trimmed.includes('://')) return fallback;
  return trimmed;
}
