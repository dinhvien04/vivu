/**
 * Resolved canonical site URL used for SEO metadata, JSON-LD, sitemap and robots.
 *
 * Reads `NEXT_PUBLIC_SITE_URL` (set per environment), with a sensible local
 * default. Strips any trailing slash so callers can safely concatenate paths.
 */
export const SITE_URL: string = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const value = raw && raw.length > 0 ? raw : 'http://localhost:3000';
  return value.replace(/\/+$/, '');
})();

/** Build an absolute URL for a path that starts with `/`. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}
