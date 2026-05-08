import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/icon';
import { PlacesMapLoader } from '@/components/map/places-map-loader';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { placeCategoryName, placeRegionName } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import {
  listCategories,
  listPlaces,
  listRegions,
  type PlaceSeason,
  type PlaceSort,
} from '@/lib/api';
import type { Place } from '@vivu/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'map' });
  return {
    title: t('title'),
    description: t('lead'),
  };
}

function isSeason(v: string | undefined): v is PlaceSeason {
  return v === 'spring' || v === 'summer' || v === 'autumn' || v === 'winter';
}

function isSort(v: string | undefined): v is PlaceSort {
  return v === 'recent' || v === 'name';
}

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    region?: string;
    category?: string;
    season?: string;
    sort?: string;
  }>;
}

type SearchParamsShape = NonNullable<Awaited<NonNullable<PageProps['searchParams']>>>;

function buildHref(current: SearchParamsShape, override: Partial<SearchParamsShape>): string {
  const params = new URLSearchParams();
  const next = { ...current, ...override };
  for (const [key, value] of Object.entries(next)) {
    if (value && typeof value === 'string') params.set(key, value);
  }
  for (const [key, value] of Object.entries(override)) {
    if (!value) params.delete(key);
  }
  const qs = params.toString();
  return qs ? `/ban-do?${qs}` : '/ban-do';
}

export default async function BanDoPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const sp = ((await searchParams) ?? {}) as SearchParamsShape;
  const region = sp.region;
  const category = sp.category;
  const season = isSeason(sp.season) ? sp.season : undefined;
  const sort = isSort(sp.sort) ? sp.sort : 'recent';

  const [placesResult, regions, categories] = await Promise.all([
    listPlaces({ region, category, season, sort, pageSize: 200 }).catch((e) => ({
      _error: e instanceof Error ? e.message : 'unknown',
    })),
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const error = '_error' in placesResult ? (placesResult as { _error: string })._error : null;
  const result =
    error || !('data' in placesResult)
      ? { data: [] as Place[], meta: { page: 1, pageSize: 200, total: 0 } }
      : placesResult;
  const places = result.data;
  const geoCount = places.filter((p) => p.geo).length;
  const activeFilterCount = [region, category, season].filter(Boolean).length;

  const SEASON_OPTIONS = [
    { slug: '' as const, key: 'any' as const },
    { slug: 'spring' as const, key: 'spring' as const },
    { slug: 'summer' as const, key: 'summer' as const },
    { slug: 'autumn' as const, key: 'autumn' as const },
    { slug: 'winter' as const, key: 'winter' as const },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-label-md text-on-surface-variant">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">
                  {t('place.breadcrumbHome')}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-primary">{t('nav.map')}</li>
            </ol>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-overline uppercase tracking-overline text-secondary">
                {t('map.overline')}
              </p>
              <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('map.title')}</h1>
              <p className="mt-3 max-w-2xl font-sans text-body-lg text-on-surface-variant">
                {t('map.lead')}
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-sm shadow-sm">
              {t.rich('map.geoCount', {
                geo: geoCount,
                total: result.meta.total,
                strong: (chunks) => <span className="font-semibold text-on-surface">{chunks}</span>,
              })}
            </div>
          </div>
        </header>

        {/* Filters */}
        <section
          aria-label={t('map.filtersTitle')}
          className="mb-6 space-y-4 rounded-2xl border border-outline-variant bg-surface px-5 py-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-h4 text-h4 text-on-surface">{t('map.filtersTitle')}</h2>
            {activeFilterCount > 0 && (
              <Link
                href={buildHref(sp, { region: '', category: '', season: '' })}
                className="text-label-md text-primary hover:underline"
              >
                {t('common.clearAll')}
              </Link>
            )}
          </div>

          {/* Region */}
          <div>
            <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
              {t('map.filterRegion')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={buildHref(sp, { region: '' })}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                    !region
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant text-on-surface hover:border-primary'
                  }`}
                >
                  {t('map.noFilters')}
                </Link>
              </li>
              {regions.map((r) => (
                <li key={r.id}>
                  <Link
                    href={buildHref(sp, { region: r.slug })}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                      region === r.slug
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant text-on-surface hover:border-primary'
                    }`}
                  >
                    {placeRegionName(r, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Category */}
          <div>
            <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
              {t('map.filterCategory')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={buildHref(sp, { category: '' })}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                    !category
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant text-on-surface hover:border-primary'
                  }`}
                >
                  {t('map.noFilters')}
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref(sp, { category: c.slug })}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                      category === c.slug
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant text-on-surface hover:border-primary'
                    }`}
                  >
                    {c.icon && <Icon name={c.icon} className="!text-base" />}
                    {placeCategoryName(c, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Season */}
          <div>
            <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
              {t('map.filterSeason')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {SEASON_OPTIONS.map((s) => {
                const active = (s.slug || undefined) === season;
                return (
                  <li key={s.slug || 'any'}>
                    <Link
                      href={buildHref(sp, { season: s.slug })}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                        active
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant text-on-surface hover:border-primary'
                      }`}
                    >
                      {t(`seasons.${s.key}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        <PlacesMapLoader places={places} locale={locale} />

        <p className="mt-3 text-body-sm text-on-surface-variant">{t('map.layerHint')}</p>
      </main>
      <SiteFooter />
    </>
  );
}
