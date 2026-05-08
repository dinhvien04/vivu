import type { MetadataRoute } from 'next';
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
  { path: '/tim-kiem', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/hoi-dap', changeFrequency: 'daily', priority: 0.6 },
  { path: '/dang-nhap', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/dang-ky', changeFrequency: 'monthly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // Pull as many published places as we can in a single request. The API caps
  // pageSize but anything above the current catalog returns the full list.
  let placesEntries: MetadataRoute.Sitemap = [];
  try {
    const result = await listPlaces({ pageSize: 200 });
    placesEntries = result.data.map((p) => ({
      url: absoluteUrl(`/dia-diem/${p.slug}`),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // If the API is unreachable at build time we still emit the static URLs.
  }

  return [...staticEntries, ...placesEntries];
}
