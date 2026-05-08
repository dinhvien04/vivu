import Link from 'next/link';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  listCategories,
  listPlaces,
  listRegions,
  type PlaceSeason,
  type PlaceSort,
} from '@/lib/api';

export const metadata = { title: 'Khám phá' };

const SEASON_OPTIONS: { slug: PlaceSeason | ''; label: string }[] = [
  { slug: '', label: 'Mọi mùa' },
  { slug: 'spring', label: 'Mùa xuân' },
  { slug: 'summer', label: 'Mùa hè' },
  { slug: 'autumn', label: 'Mùa thu' },
  { slug: 'winter', label: 'Mùa đông' },
];

const SORT_OPTIONS: { slug: PlaceSort; label: string }[] = [
  { slug: 'recent', label: 'Mới cập nhật' },
  { slug: 'name', label: 'Theo tên (A-Z)' },
];

interface PageProps {
  searchParams?: {
    region?: string;
    category?: string;
    season?: string;
    sort?: string;
    q?: string;
  };
}

function buildHref(
  current: PageProps['searchParams'],
  override: Partial<NonNullable<PageProps['searchParams']>>,
): string {
  const params = new URLSearchParams();
  const next = { ...current, ...override };
  for (const [key, value] of Object.entries(next)) {
    if (value && typeof value === 'string') params.set(key, value);
  }
  // Drop falsy keys explicitly toggled off (override = '')
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

export default async function KhamPhaPage({ searchParams }: PageProps) {
  const region = searchParams?.region;
  const category = searchParams?.category;
  const season = isPlaceSeason(searchParams?.season) ? searchParams?.season : undefined;
  const sort = isPlaceSort(searchParams?.sort) ? searchParams?.sort : 'recent';
  const q = searchParams?.q;

  const [placesResult, regions, categories] = await Promise.all([
    listPlaces({ region, category, season, sort, q, pageSize: 50 }).catch((e) => ({
      _error: e instanceof Error ? e.message : 'Lỗi không xác định',
    })),
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const error = '_error' in placesResult ? (placesResult as { _error: string })._error : null;
  const result =
    '_error' in placesResult ? null : (placesResult as Awaited<ReturnType<typeof listPlaces>>);

  // Region tabs: "Tất cả" + parent regions (parentId = null)
  const regionTabs = [
    { slug: '', nameVi: 'Tất cả' },
    ...regions.filter((r) => r.parentId === null),
  ];

  const activeFilterCount = [region, category, season].filter(Boolean).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 max-w-3xl">
          <p className="text-overline uppercase tracking-overline text-secondary">Khám phá</p>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">Địa điểm du lịch Việt Nam</h1>
          <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
            Tra cứu các điểm đến nổi bật từ Bắc vào Nam — núi rừng Tây Bắc, biển đảo miền Trung, di
            sản văn hoá và phố cổ trên khắp đất nước.
          </p>
        </header>

        {/* Region tabs */}
        <nav
          aria-label="Lọc theo vùng miền"
          className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-3"
        >
          {regionTabs.map((tab) => {
            const active = (region ?? '') === tab.slug;
            const href = buildHref(searchParams, { region: tab.slug });
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
                {tab.nameVi}
              </Link>
            );
          })}
        </nav>

        {/* Filter row */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Chủ đề
              </span>
              <Link
                href={buildHref(searchParams, { category: '' })}
                className={
                  !category
                    ? 'rounded-full bg-on-surface px-3 py-1 text-body-sm font-semibold text-white'
                    : 'rounded-full border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                }
              >
                Tất cả
              </Link>
              {categories.map((c) => {
                const active = category === c.slug;
                return (
                  <Link
                    key={c.id}
                    href={buildHref(searchParams, { category: active ? '' : c.slug })}
                    className={
                      active
                        ? 'inline-flex items-center gap-1 rounded-full bg-on-surface px-3 py-1 text-body-sm font-semibold text-white'
                        : 'inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary'
                    }
                  >
                    {c.icon && <Icon name={c.icon} className="!text-base" />}
                    {c.nameVi}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Season + sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Mùa
              </span>
              {SEASON_OPTIONS.map((s) => {
                const active = (season ?? '') === s.slug;
                return (
                  <Link
                    key={s.slug || 'all-seasons'}
                    href={buildHref(searchParams, { season: s.slug })}
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
                Sắp xếp
              </span>
              {SORT_OPTIONS.map((s) => {
                const active = sort === s.slug;
                return (
                  <Link
                    key={s.slug}
                    href={buildHref(searchParams, { sort: s.slug })}
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

        {/* Active filters reset */}
        {activeFilterCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span>{activeFilterCount} bộ lọc đang áp dụng.</span>
            <Link href="/kham-pha" className="font-semibold text-primary hover:underline">
              Xoá tất cả
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            Không thể tải danh sách địa điểm. ({error})
          </div>
        )}

        {result && result.data.length === 0 && (
          <div className="rounded-lg bg-surface-container p-6 text-body-md text-on-surface-variant">
            Không tìm thấy địa điểm phù hợp. Thử{' '}
            <Link href="/kham-pha" className="text-primary underline">
              xoá bộ lọc
            </Link>{' '}
            hoặc đổi vùng miền.
          </div>
        )}

        {result && result.data.length > 0 && (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              Tổng cộng {result.meta.total} địa điểm
            </p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} />
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
