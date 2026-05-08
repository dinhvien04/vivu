/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { listPlaces, type Place } from '@/lib/api';
import { transformCloudinary } from '@/lib/image';

const REGION_LABEL: Record<string, string> = {
  'mien-bac': 'MIỀN BẮC',
  'mien-trung': 'MIỀN TRUNG',
  'mien-nam': 'MIỀN NAM',
  'tay-nguyen': 'TÂY NGUYÊN',
};

const FEATURED_REGIONS = ['mien-bac', 'mien-trung', 'mien-nam', 'tay-nguyen'];

const SEARCH_FILTERS = [
  { icon: 'location_on', label: 'Vùng miền: Miền Trung' },
  { icon: 'category', label: 'Chủ đề: Biển đảo' },
  { icon: 'calendar_month', label: 'Mùa: Mùa Hè' },
];

interface FeaturedCollection {
  region: string;
  title: string;
  href: string;
  image: string | null;
  alt: string;
}

async function loadHomeData(): Promise<{
  hero: Place | null;
  collections: FeaturedCollection[];
}> {
  // Fetch one published place per region in parallel.
  const results = await Promise.allSettled(
    FEATURED_REGIONS.map((slug) => listPlaces({ region: slug, pageSize: 1 })),
  );

  const collections: FeaturedCollection[] = [];
  let hero: Place | null = null;

  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const place = r.value.data[0];
    if (!place) return;
    if (!hero) hero = place;
    const slug = FEATURED_REGIONS[i];
    collections.push({
      region: (slug && REGION_LABEL[slug]) ?? '',
      title: place.titleVi,
      href: `/dia-diem/${place.slug}`,
      image: transformCloudinary(place.heroImageUrl, {
        width: 600,
        height: 800,
        crop: 'fill',
      }),
      alt: place.titleVi,
    });
  });

  return { hero, collections };
}

export default async function HomePage() {
  const { hero, collections } = await loadHomeData();
  const heroImage = transformCloudinary(hero?.heroImageUrl ?? null, {
    width: 1200,
    height: 900,
    crop: 'fill',
  });
  const heroAlt = hero?.titleVi ?? 'Phong cảnh Việt Nam';
  const heroHref = hero ? `/dia-diem/${hero.slug}` : '/kham-pha';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        {/* Hero */}
        <section className="flex flex-col items-center gap-12 py-section-gap md:flex-row">
          <div className="flex-1 space-y-6">
            <h1 className="font-h1 text-h1 text-on-surface">Vivu · Du lịch Việt Nam</h1>
            <p className="max-w-2xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
              Portal tra cứu địa điểm du lịch: khám phá theo vùng miền, chủ đề và mùa, kèm bản đồ
              tương tác và đánh giá cộng đồng. Không bán tour, không đặt phòng — chỉ là tra cứu
              thuần tuý.
            </p>
            <div className="pt-4">
              <Link
                href="/kham-pha"
                className="inline-flex items-center rounded-lg bg-primary-container px-8 py-4 text-body-md font-semibold text-on-primary shadow-premium transition-all hover:scale-105 hover:shadow-hover active:scale-95"
              >
                Bắt đầu khám phá →
              </Link>
            </div>
          </div>
          <Link
            href={heroHref}
            className="group relative aspect-[4/3] w-full flex-1 overflow-hidden rounded-xl shadow-premium"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary/20 to-transparent" />
            {heroImage ? (
              <img
                src={heroImage}
                alt={heroAlt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container via-tertiary-container to-secondary-container">
                <Icon name="travel_explore" className="!text-6xl text-primary" />
              </div>
            )}
            {hero && (
              <div className="absolute bottom-4 left-4 right-4 z-20 rounded-lg bg-black/40 px-4 py-2 text-white backdrop-blur-sm">
                <p className="text-label-caps uppercase">Gợi ý của tuần</p>
                <p className="font-h4 text-h4">{hero.titleVi}</p>
              </div>
            )}
          </Link>
        </section>

        {/* Feature cards */}
        <section className="py-section-gap">
          <div className="mb-16 text-center">
            <h2 className="font-h2 text-h2 text-on-surface">Công cụ hỗ trợ hành trình</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-primary-container" />
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {/* Card 1: Tìm kiếm nhanh */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="search" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Tìm kiếm nhanh</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Lọc địa điểm theo vùng miền (Bắc, Trung, Nam), chủ đề thiên nhiên hoặc văn hóa, và
                thời điểm lý tưởng trong năm.
              </p>
              <div className="space-y-3 rounded-lg bg-surface-container p-4">
                {SEARCH_FILTERS.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2 rounded-md border border-outline-variant/10 bg-surface-container-lowest px-3 py-2 shadow-sm"
                  >
                    <Icon name={f.icon} className="scale-75 text-primary" />
                    <span className="text-label-caps text-on-surface-variant">{f.label}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Card 2: Bản đồ tương tác */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="map" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Bản đồ tương tác</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Trực quan hóa lộ trình với cụm điểm đến (POI clusters), xem mật độ đánh giá và lọc
                nhanh ngay trên giao diện bản đồ.
              </p>
              <div className="relative h-32 w-full overflow-hidden rounded-lg border border-outline-variant/30 bg-gradient-to-br from-primary-container via-tertiary-container to-secondary-container">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="map" className="!text-6xl text-primary opacity-40" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <span className="rounded-full bg-white/90 px-4 py-1 text-label-caps text-primary shadow-sm backdrop-blur-sm">
                    Sắp ra mắt
                  </span>
                </div>
              </div>
            </article>

            {/* Card 3: Sổ tay cá nhân */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="book" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Sổ tay cá nhân</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Lưu trữ địa điểm yêu thích, tạo bộ sưu tập theo lịch trình riêng và chia sẻ đánh giá
                thực tế với cộng đồng du lịch.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'bookmark', label: 'Lưu' },
                  { icon: 'collections_bookmark', label: 'Sưu tập' },
                  { icon: 'rate_review', label: 'Review' },
                ].map((q) => (
                  <Link
                    key={q.label}
                    href="/tai-khoan/yeu-thich"
                    className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-surface-container transition-colors hover:bg-primary-fixed"
                  >
                    <Icon name={q.icon} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {q.label}
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* Featured Collections */}
        {collections.length > 0 && (
          <section className="border-t border-outline-variant/20 py-section-gap">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-label-caps uppercase text-primary">Gợi ý hôm nay</span>
                <h2 className="mt-2 font-h2 text-h2 text-on-surface">Cảm hứng lên đường</h2>
              </div>
              <Link
                href="/kham-pha"
                className="hidden font-semibold text-primary hover:underline sm:inline"
              >
                Xem tất cả địa điểm →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              {collections.map((c) => (
                <Link key={c.title} href={c.href} className="group cursor-pointer">
                  <div className="mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-surface-container shadow-sm transition-all group-hover:shadow-premium">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.alt}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container to-tertiary-container">
                        <Icon name="image" className="!text-4xl text-primary opacity-50" />
                      </div>
                    )}
                  </div>
                  <p className="mb-1 text-label-caps text-on-surface-variant">{c.region}</p>
                  <h4 className="font-h3 text-xl font-bold transition-colors group-hover:text-primary">
                    {c.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
