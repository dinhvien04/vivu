import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { listPlaces } from '@/lib/api';
import { absoluteUrl } from '@/lib/site-url';

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/kham-pha', changeFrequency: 'daily', priority: 0.9 },
  { path: '/ban-do', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/lich-trinh', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/tu-van', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/ai-chat', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/tim-kiem', changeFrequency: 'weekly', priority: 0.6 },
];

/**
 * Build a path scoped to a locale — the default locale is served without a
 * prefix (`/kham-pha`); other locales live under `/{locale}/...` (`/en/kham-pha`).
 */
function localizedPath(locale: string, path: string): string {
  if (locale === routing.defaultLocale) return path === '/' ? '/' : path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

function localizedLanguages(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of routing.locales) {
    out[l] = absoluteUrl(localizedPath(l, path));
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((entry) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, entry.path)),
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: { languages: localizedLanguages(entry.path) },
    })),
  );

  // Pull as many published places as we can. The API caps pageSize at 100
  // so we loop through pages until we've collected every published place.
  let placesEntries: MetadataRoute.Sitemap = [];
  try {
    const all: Awaited<ReturnType<typeof listPlaces>>['data'] = [];
    let page = 1;
    for (let i = 0; i < 20; i++) {
      const r = await listPlaces({ page, pageSize: 100 });
      all.push(...r.data);
      if (page * r.meta.pageSize >= r.meta.total) break;
      page += 1;
    }
    placesEntries = all.flatMap((p) => {
      const path = `/dia-diem/${p.slug}`;
      const lastModified = p.updatedAt ? new Date(p.updatedAt) : now;
      return routing.locales.map((locale) => ({
        url: absoluteUrl(localizedPath(locale, path)),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: { languages: localizedLanguages(path) },
      }));
    });
  } catch {
    // If the API is unreachable at build time we still emit the static URLs.
  }

  return [...staticEntries, ...placesEntries];
}
