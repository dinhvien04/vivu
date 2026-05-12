import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/icon';
import { PlacesMapLoader } from '@/components/map/places-map-loader';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  listCategories,
  listPlaces,
  listRegions,
  type PlaceSeason,
  type PlaceSort,
} from '@/lib/api';

const EXPLORE_VIEWS = ['grid', 'map'] as const;
type ExploreView = (typeof EXPLORE_VIEWS)[number];

function isExploreView(value: string | undefined): value is ExploreView {
  return value === 'grid' || value === 'map';
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explore' });
  return { title: t('title') };
}

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    region?: string;
    category?: string;
    season?: string;
    sort?: string;
    q?: string;
    minRating?: string;
    view?: string;
  }>;
}

function buildHref(
  current: Awaited<NonNullable<PageProps['searchParams']>> | undefined,
  override: Partial<NonNullable<Awaited<NonNullable<PageProps['searchParams']>>>>,
): string {
  const params = new URLSearchParams();
  const next = { ...current, ...override };
  for (const [key, value] of Object.entries(next)) {
    if (value && typeof value === 'string') params.set(key, value);
  }
  for (const [key, value] of Object.entries(override)) {
    if (!value) params.delete(key);
  }
  const qs = params.toString();
  return qs ? `/kham-pha?${qs}` : '/kham-pha';
}

function isPlaceSeason(value: string | undefined): value is PlaceSeason {
  return value === 'spring' || value === 'summer' || value === 'autumn' || value === 'winter';
}

function isPlaceSort(value: string | undefined): value is PlaceSort {
  return value === 'recent' || value === 'name';
}

export default async function KhamPhaPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const sp = (await searchParams) ?? {};
  const region = sp.region;
  const category = sp.category;
  const season = isPlaceSeason(sp.season) ? sp.season : undefined;
  const sort = isPlaceSort(sp.sort) ? sp.sort : 'recent';
  const q = sp.q;
  const minRatingRaw = sp.minRating ? Number(sp.minRating) : NaN;
  const minRating =
    Number.isFinite(minRatingRaw) && minRatingRaw >= 1 && minRatingRaw <= 5
      ? minRatingRaw
      : undefined;
  const view: ExploreView = isExploreView(sp.view) ? sp.view : 'grid';
  // Map view needs every published place with coordinates within the active
  // filters; bump pageSize so we don't paginate the map.
  const pageSize = view === 'map' ? 200 : 50;

  const [placesResult, regions, categories] = await Promise.all([
    listPlaces({ region, category, season, sort, q, minRating, pageSize }).catch((e) => ({
      _error: e instanceof Error ? e.message : 'unknown',
    })),
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const error = '_error' in placesResult ? (placesResult as { _error: string })._error : null;
  const result =
    '_error' in placesResult ? null : (placesResult as Awaited<ReturnType<typeof listPlaces>>);

  const SEASON_OPTIONS: { slug: PlaceSeason | ''; label: string }[] = [
    { slug: '', label: t('seasons.any') },
    { slug: 'spring', label: t('seasons.spring') },
    { slug: 'summer', label: t('seasons.summer') },
    { slug: 'autumn', label: t('seasons.autumn') },
    { slug: 'winter', label: t('seasons.winter') },
  ];

  const SORT_OPTIONS: { slug: PlaceSort; label: string }[] = [
    { slug: 'recent', label: t('sort.recent') },
    { slug: 'name', label: t('sort.name') },
  ];

  const RATING_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: t('explore.ratingAny') },
    { value: '4', label: t('explore.ratingFour') },
    { value: '3', label: t('explore.ratingThree') },
  ];

  const regionTabs = [
    { slug: '', name: t('common.all') },
    ...regions
      .filter((r) => r.parentId === null)
      .map((r) => ({
        slug: r.slug,
        name: locale === 'en' && r.nameEn ? r.nameEn : r.nameVi,
      })),
  ];

  const activeFilterCount = [region, category, season, minRating].filter(Boolean).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 max-w-3xl">
          <p className="text-overline uppercase tracking-overline text-secondary">
            {t('explore.title')}
          </p>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('explore.headline')}</h1>
          <p className="mt-3 font-sans text-body-lg text-on-surface-variant">{t('explore.lead')}</p>
        </header>

        {/* Region tabs */}
        <nav
          aria-label={t('explore.regionTab')}
          className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-3"
        >
          {regionTabs.map((tab) => {
            const active = (region ?? '') === tab.slug;
            const href = buildHref(sp, { region: tab.slug });
            return (
              <Link
                key={tab.slug || 'all'}
                href={href}
                className={
                  active
                    ? 'rounded-full bg-primary px-4 py-2 text-body-md font-semibold text-white'
                    : 'rounded-full bg-surface-container px-4 py-2 text-body-md font-medium text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-on-secondary-container'
                }
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>

        {/* Filter row */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('explore.categoryTab')}
              </span>
              <Link
                href={buildHref(sp, { category: '' })}
                className={
                  !category
                    ? 'rounded-full bg-on-surface px-3 py-1 text-body-sm font-semibold text-white'
                    : 'rounded-full border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                }
              >
                {t('common.all')}
              </Link>
              {categories.map((c) => {
                const active = category === c.slug;
                const name = locale === 'en' && c.nameEn ? c.nameEn : c.nameVi;
                return (
                  <Link
                    key={c.id}
                    href={buildHref(sp, { category: active ? '' : c.slug })}
                    className={
                      active
                        ? 'inline-flex items-center gap-1 rounded-full bg-on-surface px-3 py-1 text-body-sm font-semibold text-white'
                        : 'inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                    }
                  >
                    {c.icon && <Icon name={c.icon} className="!text-base" />}
                    {name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Season + sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('explore.seasonTab')}
              </span>
              {SEASON_OPTIONS.map((s) => {
                const active = (season ?? '') === s.slug;
                return (
                  <Link
                    key={s.slug || 'all-seasons'}
                    href={buildHref(sp, { season: s.slug })}
                    className={
                      active
                        ? 'rounded-full bg-secondary-container px-3 py-1 text-body-sm font-semibold text-on-secondary-container'
                        : 'rounded-full px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container'
                    }
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-2 lg:ml-auto">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('common.sort')}
              </span>
              {SORT_OPTIONS.map((s) => {
                const active = sort === s.slug;
                return (
                  <Link
                    key={s.slug}
                    href={buildHref(sp, { sort: s.slug })}
                    className={
                      active
                        ? 'inline-flex items-center gap-1 rounded-lg border border-primary bg-primary/5 px-3 py-1 text-body-sm font-semibold text-primary'
                        : 'inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                    }
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rating row */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-overline uppercase tracking-overline text-on-surface-variant">
            {t('explore.ratingTab')}
          </span>
          {RATING_OPTIONS.map((r) => {
            const active = (minRating ? String(minRating) : '') === r.value;
            return (
              <Link
                key={r.value || 'any-rating'}
                href={buildHref(sp, { minRating: r.value })}
                className={
                  active
                    ? 'inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-body-sm font-semibold text-amber-900'
                    : 'inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                }
              >
                {r.value && <Icon name="star" className="!text-base text-amber-500" />}
                {r.label}
              </Link>
            );
          })}
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span>{t('explore.filtersApplied', { count: activeFilterCount })}</span>
            <Link href="/kham-pha" className="font-semibold text-primary hover:underline">
              {t('common.clearAll')}
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {t('explore.errorTitle')}
            <span className="ml-1 opacity-70">({error})</span>
          </div>
        )}

        {result && result.data.length === 0 && (
          <div className="rounded-lg bg-surface-container p-6 text-body-md text-on-surface-variant">
            {t('explore.empty')}{' '}
            <Link href="/kham-pha" className="text-primary underline">
              {t('common.clearAll')}
            </Link>
            .
          </div>
        )}

        {/* View toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div
            className="inline-flex rounded-lg border border-outline-variant bg-surface-container p-1"
            role="tablist"
            aria-label={t('explore.title')}
          >
            {(
              [
                { v: 'grid' as const, icon: 'grid_view', key: 'viewGrid' as const },
                { v: 'map' as const, icon: 'map', key: 'viewMap' as const },
              ] as const
            ).map((opt) => {
              const active = view === opt.v;
              return (
                <Link
                  key={opt.v}
                  href={buildHref(sp, { view: opt.v === 'grid' ? '' : opt.v })}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-label-md transition-colors ${
                    active
                      ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  role="tab"
                  aria-selected={active}
                >
                  <Icon name={opt.icon} className="!text-base" />
                  <span className="hidden sm:inline">{t(`explore.${opt.key}`)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {result && result.data.length > 0 && view === 'map' && (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              {t('explore.mapHint', {
                geo: result.data.filter((p) => p.geo).length,
                total: result.data.length,
              })}
            </p>
            <PlacesMapLoader places={result.data} height="65vh" locale={locale} />
          </div>
        )}

        {result && result.data.length > 0 && view === 'grid' && (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              {t('explore.totalPlaces', { total: result.meta.total })}
            </p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} locale={locale} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
