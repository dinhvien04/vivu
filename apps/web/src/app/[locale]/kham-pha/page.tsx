import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExploreSearch } from '@/components/explore-search';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { PlacesMapLoader } from '@/components/map/places-map-loader';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { placeSummary, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listPlaces, type Place, type PlaceSort } from '@/lib/api';
import { hasPlaceImage } from '@/lib/place-image';

const TOPIC_FILTERS = [
  { slug: '', vi: 'Tất cả', en: 'All', categorySlugs: [], keywords: [] },
  {
    slug: 'danh-lam-thang-canh',
    vi: 'Danh lam thắng cảnh',
    en: 'Scenic places',
    categorySlugs: ['danh-lam-thang-canh', 'nui-rung'],
    keywords: ['danh lam', 'thắng cảnh', 'núi', 'đồi', 'cao nguyên', 'rừng', 'khu sinh thái'],
  },
  {
    slug: 'di-tich',
    vi: 'Di tích',
    en: 'Historic sites',
    categorySlugs: ['di-tich', 'di-san'],
    keywords: ['di tích', 'di sản', 'lịch sử', 'đình', 'nhà tù', 'thành', 'lũy', 'hội quán'],
  },
  {
    slug: 'bien-dao',
    vi: 'Biển đảo',
    en: 'Beaches & islands',
    categorySlugs: ['bien-dao'],
    keywords: ['biển', 'bãi', 'đảo', 'hòn', 'làng chài', 'kỳ co', 'eo gió'],
  },
  {
    slug: 'chua',
    vi: 'Chùa',
    en: 'Pagodas',
    categorySlugs: ['chua', 'van-hoa'],
    keywords: ['chùa', 'thiền viện', 'tịnh xá', 'tu viện'],
  },
  {
    slug: 'thap-cham',
    vi: 'Tháp Chăm',
    en: 'Cham towers',
    categorySlugs: ['thap-cham'],
    keywords: ['tháp', 'chăm', 'champa', 'dương long', 'bánh ít', 'thủ thiện', 'phú lốc'],
  },
  {
    slug: 'bao-tang',
    vi: 'Bảo tàng',
    en: 'Museums',
    categorySlugs: ['bao-tang'],
    keywords: ['bảo tàng', 'museum', 'trung tâm khám phá', 'khoa học'],
  },
  {
    slug: 'ho-thac-suoi',
    vi: 'Hồ - thác - suối',
    en: 'Lakes, falls & streams',
    categorySlugs: ['ho-thac-suoi', 'thac-suoi'],
    keywords: ['hồ', 'thác', 'suối', 'biển hồ', 'đá vàng', 'đá cổ'],
  },
] as const;

const AREA_FILTERS = [
  { slug: '', vi: 'Tất cả', en: 'All', keywords: [] },
  { slug: 'pleiku', vi: 'Pleiku', en: 'Pleiku', keywords: ['pleiku', 'biển hồ', 'nhà lao pleiku'] },
  { slug: 'quy-nhon', vi: 'Quy Nhơn', en: 'Quy Nhon', keywords: ['quy nhơn', 'quy nhon'] },
  { slug: 'an-nhon', vi: 'An Nhơn', en: 'An Nhon', keywords: ['an nhơn', 'an nhon'] },
  { slug: 'tuy-phuoc', vi: 'Tuy Phước', en: 'Tuy Phuoc', keywords: ['tuy phước', 'tuy phuoc'] },
  { slug: 'phu-cat', vi: 'Phù Cát', en: 'Phu Cat', keywords: ['phù cát', 'phu cat'] },
  { slug: 'phu-my', vi: 'Phù Mỹ', en: 'Phu My', keywords: ['phù mỹ', 'phu my'] },
  { slug: 'hoai-nhon', vi: 'Hoài Nhơn', en: 'Hoai Nhon', keywords: ['hoài nhơn', 'hoai nhon'] },
] as const;

const NEED_FILTERS = [
  { slug: '', vi: 'Tất cả', en: 'All needs', categorySlugs: [], keywords: [] },
  {
    slug: 'chup-anh',
    vi: 'Chụp ảnh đẹp',
    en: 'Photo spots',
    categorySlugs: ['danh-lam-thang-canh', 'bien-dao', 'nui-rung'],
    keywords: ['check in', 'chụp ảnh', 'cảnh đẹp', 'view', 'eo gió', 'kỳ co', 'biển', 'tháp'],
  },
  {
    slug: 'gia-dinh',
    vi: 'Đi cùng gia đình',
    en: 'Family friendly',
    categorySlugs: ['bao-tang', 'ho-thac-suoi', 'danh-lam-thang-canh'],
    keywords: ['gia đình', 'trẻ em', 'bảo tàng', 'công viên', 'khoa học', 'hồ', 'biển'],
  },
  {
    slug: 'nua-ngay',
    vi: 'Đi nửa ngày',
    en: 'Half day',
    categorySlugs: ['di-tich', 'thap-cham', 'bao-tang', 'chua'],
    keywords: ['gần trung tâm', 'nửa ngày', 'tham quan', 'di tích', 'tháp', 'chùa', 'bảo tàng'],
  },
  {
    slug: 'mot-ngay',
    vi: 'Lịch trình 1 ngày',
    en: 'One day',
    categorySlugs: ['bien-dao', 'danh-lam-thang-canh', 'ho-thac-suoi'],
    keywords: ['1 ngày', 'một ngày', 'đảo', 'biển', 'hồ', 'thác', 'suối', 'khu sinh thái'],
  },
  {
    slug: 'lich-su-van-hoa',
    vi: 'Lịch sử - văn hoá',
    en: 'History & culture',
    categorySlugs: ['di-tich', 'di-san', 'thap-cham', 'chua', 'van-hoa', 'bao-tang'],
    keywords: ['lịch sử', 'văn hoá', 'di tích', 'di sản', 'tháp', 'chăm', 'chùa', 'hội quán'],
  },
  {
    slug: 'thien-nhien',
    vi: 'Thiên nhiên',
    en: 'Nature',
    categorySlugs: ['danh-lam-thang-canh', 'nui-rung', 'ho-thac-suoi', 'bien-dao'],
    keywords: ['thiên nhiên', 'núi', 'rừng', 'hồ', 'thác', 'suối', 'biển', 'đảo', 'cao nguyên'],
  },
] as const;

type ExploreView = 'grid' | 'map';

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    topic?: string;
    area?: string;
    aiReady?: string;
    need?: string;
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
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildPlaceSearchText(place: Place, locale: Locale): string {
  return normalize(
    [
      placeTitle(place, locale),
      place.titleVi,
      place.titleEn ?? '',
      place.locationKey ?? '',
      place.address ?? '',
      placeSummary(place, locale) ?? '',
      ...place.aliases,
    ].join(' '),
  );
}

function matchesTopic(
  place: Place,
  topic: (typeof TOPIC_FILTERS)[number],
  locale: Locale,
): boolean {
  if (topic.categorySlugs.length === 0) return true;

  const slugs = new Set<string>(topic.categorySlugs);
  const categories = place.categories ?? [];
  if (categories.length > 0) {
    return categories.some((category) => slugs.has(category.slug));
  }

  const haystack = buildPlaceSearchText(place, locale);
  return topic.keywords.some((keyword) => haystack.includes(normalize(keyword)));
}

function matchesArea(place: Place, keywords: readonly string[], locale: Locale): boolean {
  if (keywords.length === 0) return true;
  const haystack = buildPlaceSearchText(place, locale);
  return keywords.some((keyword) => haystack.includes(normalize(keyword)));
}

function matchesNeed(place: Place, need: (typeof NEED_FILTERS)[number], locale: Locale): boolean {
  if (need.categorySlugs.length === 0 && need.keywords.length === 0) return true;

  const slugs = new Set<string>(need.categorySlugs);
  const categories = place.categories ?? [];
  if (categories.length > 0 && categories.some((category) => slugs.has(category.slug))) {
    return true;
  }

  const haystack = buildPlaceSearchText(place, locale);
  return need.keywords.some((keyword) => haystack.includes(normalize(keyword)));
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
  const topic = TOPIC_FILTERS.find((item) => item.slug === sp.topic) ?? TOPIC_FILTERS[0];
  const area = AREA_FILTERS.find((item) => item.slug === sp.area) ?? AREA_FILTERS[0];
  const need = NEED_FILTERS.find((item) => item.slug === sp.need) ?? NEED_FILTERS[0];
  const aiReady = sp.aiReady === 'true';
  const sort: PlaceSort = sp.sort === 'name' ? 'name' : 'recent';
  const view: ExploreView = sp.view === 'map' ? 'map' : 'grid';

  const placesResult = await listPlaces({
    province: 'Gia Lai',
    pageSize: 100,
    sort,
    q: sp.q?.trim() || undefined,
    isAiReady: aiReady ? true : undefined,
  }).catch(() => null);

  const places =
    placesResult?.data
      .filter(hasPlaceImage)
      .filter((place) => matchesTopic(place, topic, locale))
      .filter((place) => matchesArea(place, area.keywords, locale))
      .filter((place) => matchesNeed(place, need, locale)) ?? [];
  const geoPlaces = places.filter((place) => place.geo);

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

        <ExploreSearch initialQuery={sp.q ?? ''} locale={locale} />

        <nav
          aria-label={t('explore.categoryTab')}
          className="mb-5 flex flex-wrap gap-2 border-b border-outline-variant pb-4"
        >
          {TOPIC_FILTERS.map((item) => {
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

        <nav
          aria-label={locale === 'en' ? 'Area' : 'Khu vực'}
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-overline uppercase tracking-overline text-on-surface-variant">
            {locale === 'en' ? 'Area' : 'Khu vực'}
          </span>
          {AREA_FILTERS.map((item) => {
            const active = area.slug === item.slug;
            return (
              <Link
                key={item.slug || 'all-area'}
                href={buildHref(sp, { area: item.slug })}
                className={
                  active
                    ? 'rounded-full bg-secondary-container px-3 py-1.5 text-body-sm font-semibold text-on-secondary-container'
                    : 'rounded-full border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                }
              >
                {locale === 'en' ? item.en : item.vi}
              </Link>
            );
          })}
        </nav>

        <nav
          aria-label={locale === 'en' ? 'Travel needs' : 'Nhu cầu'}
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-overline uppercase tracking-overline text-on-surface-variant">
            {locale === 'en' ? 'Needs' : 'Nhu cầu'}
          </span>
          {NEED_FILTERS.map((item) => {
            const active = need.slug === item.slug;
            return (
              <Link
                key={item.slug || 'all-need'}
                href={buildHref(sp, { need: item.slug })}
                className={
                  active
                    ? 'rounded-full bg-tertiary-container px-3 py-1.5 text-body-sm font-semibold text-on-tertiary-container'
                    : 'rounded-full border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
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

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildHref(sp, { aiReady: aiReady ? '' : 'true' })}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-label-md ${
                aiReady
                  ? 'border-primary bg-primary-fixed font-semibold text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              <Icon name="auto_awesome" className="!text-base" />
              {locale === 'en' ? 'AI ready' : 'Có dữ liệu AI'}
            </Link>
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

        {placesResult && view === 'map' && geoPlaces.length > 0 && (
          <>
            <PlacesMapLoader places={geoPlaces} locale={locale} height="560px" />
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {t.rich('map.geoCount', {
                geo: geoPlaces.length,
                total: places.length,
                strong: (chunks) => <strong className="text-on-surface">{chunks}</strong>,
              })}
            </p>
          </>
        )}

        {placesResult && view === 'map' && geoPlaces.length === 0 && (
          <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/40 px-6 text-center">
            <Icon name="map" className="!text-5xl text-primary" />
            <h2 className="mt-4 font-h4 text-h4 text-on-surface">{t('map.noGeoPlaces')}</h2>
            <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
              {t('explore.empty')}
            </p>
          </section>
        )}

        {placesResult && view === 'grid' && places.length === 0 && (
          <div className="py-8">
            <EmptyState
              icon="search_off"
              title={locale === 'en' ? 'No destinations found' : 'Không tìm thấy địa danh'}
              description={t('explore.empty')}
            />
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
