import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPanel } from '@/components/map-panel';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { placeCategoryName, placeRegionName } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listCategories, listPlaces, listRegions } from '@/lib/api';
import type { Place } from '@/lib/api';

/**
 * Walk the paginated `/places` endpoint and concatenate the results. The
 * API caps `pageSize` at 100 so we loop until we've collected every page.
 * Stops after 20 pages as a defensive ceiling.
 */
async function fetchAllPlaces(): Promise<Place[]> {
  const all: Place[] = [];
  let page = 1;
  for (let i = 0; i < 20; i++) {
    const r = await listPlaces({ page, pageSize: 100 });
    all.push(...r.data);
    if (page * r.meta.pageSize >= r.meta.total) break;
    page += 1;
  }
  return all;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'map' });
  return { title: t('title') };
}

export default async function MapPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'map' });

  const [places, regions, categories] = await Promise.all([
    fetchAllPlaces(),
    listRegions(),
    listCategories(),
  ]);

  const geoCount = places.filter((p) => p.geo).length;

  const regionOptions = regions.map((r) => ({
    slug: r.slug,
    name: placeRegionName(r, locale),
  }));
  const categoryOptions = categories.map((c) => ({
    slug: c.slug,
    name: placeCategoryName(c, locale),
    icon: c.icon ?? null,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-6">
          <span className="text-overline uppercase tracking-overline text-primary">
            {t('overline')}
          </span>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('title')}</h1>
          <p className="mt-3 max-w-3xl text-body text-on-surface-variant">{t('lead')}</p>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {t.rich('geoCount', {
              geo: geoCount,
              total: places.length,
              strong: (chunks) => <strong className="text-on-surface">{chunks}</strong>,
            })}
          </p>
        </header>
        <MapPanel
          locale={locale}
          places={places}
          regions={regionOptions}
          categories={categoryOptions}
          messages={{
            filtersTitle: t('filtersTitle'),
            filterRegion: t('filterRegion'),
            filterCategory: t('filterCategory'),
            noFilters: t('noFilters'),
            layerHint: t('layerHint'),
            noGeoPlaces: t('noGeoPlaces'),
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
