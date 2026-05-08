import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { PlacesMapLoader } from '@/components/map/places-map-loader';
import { PlaceCard } from '@/components/place-card';
import { SearchHero } from '@/components/search-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  listCategories,
  listPlaces,
  listRegions,
  type PlaceSeason,
  type PlaceSort,
} from '@/lib/api';
import { transformCloudinary } from '@/lib/image';
import type { Place } from '@vivu/types';

export const metadata = { title: 'Kết quả tìm kiếm' };

const SEARCH_VIEWS = ['grid', 'list', 'map'] as const;
type SearchView = (typeof SEARCH_VIEWS)[number];

function isView(v: string | undefined): v is SearchView {
  return v === 'grid' || v === 'list' || v === 'map';
}

function isSeason(v: string | undefined): v is PlaceSeason {
  return v === 'spring' || v === 'summer' || v === 'autumn' || v === 'winter';
}

function isSort(v: string | undefined): v is PlaceSort {
  return v === 'recent' || v === 'name';
}

interface PageProps {
  searchParams?: {
    q?: string;
    view?: string;
    region?: string;
    category?: string;
    season?: string;
    sort?: string;
    page?: string;
  };
}

function buildHref(
  current: NonNullable<PageProps['searchParams']>,
  override: Partial<NonNullable<PageProps['searchParams']>>,
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
  return qs ? `/tim-kiem?${qs}` : '/tim-kiem';
}

export default async function TimKiemPage({ searchParams }: PageProps) {
  const sp = searchParams ?? {};
  const q = sp.q?.trim() ?? '';
  const view: SearchView = isView(sp.view) ? sp.view : 'grid';
  const region = sp.region;
  const category = sp.category;
  const season = isSeason(sp.season) ? sp.season : undefined;
  const sort = isSort(sp.sort) ? sp.sort : 'recent';

  // Empty query: show prompt page.
  if (!q && !region && !category && !season) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <header className="mb-8 max-w-3xl">
            <p className="text-overline uppercase tracking-overline text-secondary">Tìm kiếm</p>
            <h1 className="mt-2 font-h1 text-h1 text-on-surface">Tìm địa điểm Việt Nam</h1>
            <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
              Nhập tên địa điểm, vùng miền hoặc chủ đề bạn muốn khám phá.
            </p>
          </header>
          <SearchHero initialQuery="" />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/kham-pha"
              className="rounded-2xl border border-outline-variant bg-surface px-6 py-6 transition-all hover:border-primary/40 hover:shadow-premium"
            >
              <Icon name="explore" className="!text-3xl text-primary" />
              <h3 className="mt-3 font-h4 text-h4 text-on-surface">Khám phá theo vùng</h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Bắc, Trung, Nam và 4 mùa trong năm.
              </p>
            </Link>
            <Link
              href="/kham-pha?category=bien-dao"
              className="rounded-2xl border border-outline-variant bg-surface px-6 py-6 transition-all hover:border-primary/40 hover:shadow-premium"
            >
              <Icon name="beach_access" className="!text-3xl text-primary" />
              <h3 className="mt-3 font-h4 text-h4 text-on-surface">Biển đảo</h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Bãi biển và đảo nổi bật khắp ba miền.
              </p>
            </Link>
            <Link
              href="/kham-pha?category=van-hoa"
              className="rounded-2xl border border-outline-variant bg-surface px-6 py-6 transition-all hover:border-primary/40 hover:shadow-premium"
            >
              <Icon name="account_balance" className="!text-3xl text-primary" />
              <h3 className="mt-3 font-h4 text-h4 text-on-surface">Văn hoá - Lịch sử</h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Đền chùa, di tích và phố cổ.
              </p>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [placesResult, regions, categories] = await Promise.all([
    listPlaces({ q, region, category, season, sort, pageSize: 60 }).catch((e) => ({
      _error: e instanceof Error ? e.message : 'Lỗi không xác định',
    })),
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const error = '_error' in placesResult ? (placesResult as { _error: string })._error : null;
  const result =
    error || !('data' in placesResult)
      ? { data: [] as Place[], meta: { page: 1, pageSize: 60, total: 0 } }
      : placesResult;
  const places = result.data;
  const total = result.meta.total;

  // Compute active filters count (q is shown separately as the query).
  const activeFilterCount = [region, category, season].filter(Boolean).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-6">
          <nav aria-label="Breadcrumb" className="mb-4 text-label-md text-on-surface-variant">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-primary">Tìm kiếm</li>
            </ol>
          </nav>
          <SearchHero initialQuery={q} />
          {q ? (
            <p className="mt-4 font-sans text-body-lg text-on-surface-variant">
              {total > 0 ? (
                <>
                  <span className="font-semibold text-on-surface">{total}</span> kết quả cho{' '}
                  <span className="font-semibold text-on-surface">&ldquo;{q}&rdquo;</span>
                </>
              ) : (
                <>
                  Không tìm thấy địa điểm cho{' '}
                  <span className="font-semibold text-on-surface">&ldquo;{q}&rdquo;</span>
                </>
              )}
            </p>
          ) : (
            <p className="mt-4 font-sans text-body-lg text-on-surface-variant">
              <span className="font-semibold text-on-surface">{total}</span> địa điểm khớp bộ lọc
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar filters */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-outline-variant bg-surface px-5 py-5">
              <div className="flex items-center justify-between">
                <h2 className="font-h4 text-h4 text-on-surface">Bộ lọc</h2>
                {activeFilterCount > 0 && (
                  <Link
                    href={buildHref(sp, { region: '', category: '', season: '' })}
                    className="text-label-md text-primary hover:underline"
                  >
                    Xoá tất cả
                  </Link>
                )}
              </div>

              {/* Region */}
              <div>
                <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
                  Vùng miền
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={buildHref(sp, { region: '' })}
                      className={`block rounded-lg px-3 py-1.5 text-body-md transition-colors ${
                        !region
                          ? 'bg-primary-container font-semibold text-on-primary-container'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      Tất cả
                    </Link>
                  </li>
                  {regions.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={buildHref(sp, { region: r.slug })}
                        className={`block rounded-lg px-3 py-1.5 text-body-md transition-colors ${
                          region === r.slug
                            ? 'bg-primary-container font-semibold text-on-primary-container'
                            : 'text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {r.nameVi}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Category */}
              <div>
                <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
                  Danh mục
                </h3>
                <ul className="flex flex-wrap gap-2">
                  <li>
                    <Link
                      href={buildHref(sp, { category: '' })}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                        !category
                          ? 'bg-primary text-white'
                          : 'border border-outline-variant text-on-surface hover:border-primary'
                      }`}
                    >
                      Tất cả
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={buildHref(sp, { category: c.slug })}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                          category === c.slug
                            ? 'bg-primary text-white'
                            : 'border border-outline-variant text-on-surface hover:border-primary'
                        }`}
                      >
                        {c.icon && <Icon name={c.icon} className="!text-base" />}
                        {c.nameVi}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Season */}
              <div>
                <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
                  Mùa đẹp nhất
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {(
                    [
                      { slug: '' as const, label: 'Mọi mùa' },
                      { slug: 'spring' as const, label: 'Xuân' },
                      { slug: 'summer' as const, label: 'Hè' },
                      { slug: 'autumn' as const, label: 'Thu' },
                      { slug: 'winter' as const, label: 'Đông' },
                    ] as const
                  ).map((s) => {
                    const active = (s.slug || undefined) === season;
                    return (
                      <li key={s.slug || 'any'}>
                        <Link
                          href={buildHref(sp, { season: s.slug })}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md transition-colors ${
                            active
                              ? 'bg-primary text-white'
                              : 'border border-outline-variant text-on-surface hover:border-primary'
                          }`}
                        >
                          {s.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>

          {/* Right column: view switcher + results */}
          <section className="lg:col-span-9">
            {/* View switcher + sort */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface px-4 py-3">
              <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container p-1">
                {(
                  [
                    { v: 'grid' as const, icon: 'grid_view', label: 'Lưới' },
                    { v: 'list' as const, icon: 'view_list', label: 'Danh sách' },
                    { v: 'map' as const, icon: 'map', label: 'Bản đồ' },
                  ] as const
                ).map((opt) => (
                  <Link
                    key={opt.v}
                    href={buildHref(sp, { view: opt.v })}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-label-md transition-colors ${
                      view === opt.v
                        ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon name={opt.icon} className="!text-base" />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label-md text-on-surface-variant">Sắp xếp:</span>
                {(
                  [
                    { slug: 'recent' as const, label: 'Mới cập nhật' },
                    { slug: 'name' as const, label: 'A-Z' },
                  ] as const
                ).map((s) => (
                  <Link
                    key={s.slug}
                    href={buildHref(sp, { sort: s.slug === 'recent' ? '' : s.slug })}
                    className={`rounded-lg px-3 py-1 text-label-md transition-colors ${
                      sort === s.slug
                        ? 'bg-primary-container font-semibold text-on-primary-container'
                        : 'border border-outline-variant text-on-surface hover:border-primary'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
              >
                {error}
              </div>
            )}

            {places.length === 0 ? (
              <EmptyState
                icon="search_off"
                title={q ? `Không tìm thấy "${q}"` : 'Không có kết quả'}
                description="Thử tìm với từ khoá khác, hoặc bỏ bớt bộ lọc để mở rộng kết quả."
                action={{ label: 'Xem tất cả địa điểm', href: '/kham-pha' }}
              />
            ) : view === 'list' ? (
              <ul className="space-y-3">
                {places.map((p) => {
                  const heroSrc = p.heroImageUrl
                    ? (transformCloudinary(p.heroImageUrl, { width: 320, height: 240 }) ??
                      p.heroImageUrl)
                    : null;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/dia-diem/${p.slug}`}
                        className="flex gap-4 overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-all hover:border-primary/40 hover:shadow-premium"
                      >
                        <div className="relative h-32 w-40 flex-shrink-0 bg-surface-container sm:h-36 sm:w-56">
                          {heroSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={heroSrc}
                              alt={p.titleVi}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-outline">
                              <Icon name="image" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-center px-1 py-3 pr-4">
                          {p.region && (
                            <p className="text-overline uppercase tracking-overline text-secondary">
                              {p.region.nameVi}
                            </p>
                          )}
                          <h3 className="mt-1 font-h4 text-h4 text-on-surface">{p.titleVi}</h3>
                          {p.summaryVi && (
                            <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
                              {p.summaryVi}
                            </p>
                          )}
                          {p.categories && p.categories.length > 0 && (
                            <p className="mt-2 inline-flex flex-wrap gap-1 text-label-caps text-on-surface-variant">
                              {p.categories.slice(0, 3).map((c) => (
                                <span
                                  key={c.id}
                                  className="rounded-full bg-surface-container px-2 py-0.5"
                                >
                                  {c.nameVi}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : view === 'map' ? (
              <div className="space-y-3">
                <PlacesMapLoader places={places} height="65vh" />
                <p className="text-body-sm text-on-surface-variant">
                  Hiển thị <strong>{places.filter((p) => p.geo).length}</strong> / {places.length}{' '}
                  kết quả có toạ độ. Cần xem toàn bộ bản đồ?{' '}
                  <Link href="/ban-do" className="font-semibold text-primary hover:underline">
                    Mở /ban-do →
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {places.map((p) => (
                  <li key={p.id}>
                    <PlaceCard place={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
