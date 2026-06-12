import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { placeSummary, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listPlaces, type Place, type PlaceSort } from '@/lib/api';

const TOPICS = [
  { slug: '', vi: 'Tất cả', en: 'All', keywords: [] },
  {
    slug: 'danh-lam-thang-canh',
    vi: 'Danh lam thắng cảnh',
    en: 'Scenic places',
    keywords: ['thắng cảnh', 'cảnh quan', 'du lịch'],
  },
  { slug: 'di-tich', vi: 'Di tích', en: 'Historic sites', keywords: ['di tích', 'lịch sử'] },
  { slug: 'bien-dao', vi: 'Biển đảo', en: 'Beaches & islands', keywords: ['biển', 'đảo'] },
  { slug: 'chua', vi: 'Chùa', en: 'Pagodas', keywords: ['chùa', 'thiền viện'] },
  { slug: 'thap-cham', vi: 'Tháp Chăm', en: 'Cham towers', keywords: ['tháp', 'chăm'] },
  { slug: 'bao-tang', vi: 'Bảo tàng', en: 'Museums', keywords: ['bảo tàng'] },
  {
    slug: 'ho-thac-suoi',
    vi: 'Hồ - thác - suối',
    en: 'Lakes, falls & streams',
    keywords: ['hồ', 'thác', 'suối'],
  },
] as const;

type ExploreView = 'grid' | 'map';

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    topic?: string;
    sort?: string;
    q?: string;
    view?: string;
  }>;
}

function buildHref(
  current: Awaited<NonNullable<PageProps['searchParams']>> | undefined,
  override: Record<string, string>,
): string {
  const params = new URLSearchParams();
  const next = { ...current, ...override };
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(override)) {
    if (!value) params.delete(key);
  }
  const query = params.toString();
  return query ? `/kham-pha?${query}` : '/kham-pha';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

function matchesTopic(place: Place, keywords: readonly string[], locale: Locale): boolean {
  if (keywords.length === 0) return true;
  const text = normalize(
    [placeTitle(place, locale), placeSummary(place, locale), place.descriptionVi ?? ''].join(' '),
  );
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explore' });
  return { title: t('title') };
}

export default async function KhamPhaPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const sp = (await searchParams) ?? {};
  const topic = TOPICS.find((item) => item.slug === sp.topic) ?? TOPICS[0];
  const sort: PlaceSort = sp.sort === 'name' ? 'name' : 'recent';
  const view: ExploreView = sp.view === 'map' ? 'map' : 'grid';

  const placesResult = await listPlaces({
    province: 'Gia Lai',
    pageSize: 100,
    sort,
    q: sp.q?.trim() || undefined,
  }).catch(() => null);

  const places =
    placesResult?.data.filter((place) => matchesTopic(place, topic.keywords, locale)) ?? [];

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

        <nav
          aria-label={t('explore.categoryTab')}
          className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-4"
        >
          {TOPICS.map((item) => {
            const active = topic.slug === item.slug;
            return (
              <Link
                key={item.slug || 'all'}
                href={buildHref(sp, { topic: item.slug })}
                className={
                  active
                    ? 'rounded-full bg-primary px-4 py-2 text-body-sm font-semibold text-white'
                    : 'rounded-full border border-outline-variant px-4 py-2 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                }
              >
                {locale === 'en' ? item.en : item.vi}
              </Link>
            );
          })}
        </nav>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-lg border border-outline-variant bg-surface-container p-1"
            role="tablist"
          >
            <Link
              href={buildHref(sp, { view: '' })}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-label-md ${
                view === 'grid'
                  ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <Icon name="grid_view" className="!text-base" />
              {t('explore.viewGrid')}
            </Link>
            <Link
              href={buildHref(sp, { view: 'map' })}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-label-md ${
                view === 'map'
                  ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <Icon name="map" className="!text-base" />
              {t('explore.viewMap')}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              {t('common.sort')}
            </span>
            <Link
              href={buildHref(sp, { sort: 'recent' })}
              className={
                sort === 'recent' ? 'font-semibold text-primary' : 'text-on-surface-variant'
              }
            >
              {t('sort.recent')}
            </Link>
            <Link
              href={buildHref(sp, { sort: 'name' })}
              className={sort === 'name' ? 'font-semibold text-primary' : 'text-on-surface-variant'}
            >
              {t('sort.name')}
            </Link>
          </div>
        </div>

        {!placesResult && (
          <div className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {t('explore.errorTitle')}
          </div>
        )}

        {placesResult && view === 'map' && (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/40 px-6 text-center">
            <Icon name="map" className="!text-5xl text-primary" />
            <p className="mt-4 font-h4 text-h4 text-on-surface">{t('map.updating')}</p>
          </div>
        )}

        {placesResult && view === 'grid' && places.length === 0 && (
          <div className="rounded-lg bg-surface-container p-6 text-body-md text-on-surface-variant">
            {t('explore.empty')}
          </div>
        )}

        {placesResult && view === 'grid' && places.length > 0 && (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              {t('explore.totalPlaces', { total: places.length })}
            </p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
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
