import { routing } from '@/i18n/routing';

export function getSafeAuthRedirect(value: string | null, fallback: string): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;

  try {
    const base = new URL('https://vivu.local');
    const target = new URL(value, base);
    return target.origin === base.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function getLocalizedAuthRedirect(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;

  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return path;

  return `/${locale}${pathname === '/' ? '' : pathname}${suffix}`;
}
