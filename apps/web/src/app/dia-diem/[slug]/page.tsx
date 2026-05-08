import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AddToCollectionButton } from '@/components/add-to-collection-button';
import { FavoriteButton } from '@/components/favorite-button';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { QaSection } from '@/components/qa-section';
import { ReviewsSection } from '@/components/reviews-section';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { listPlaces, getPlaceBySlug } from '@/lib/api';
import { transformCloudinary } from '@/lib/image';
import { listQuestionsForPlace } from '@/lib/qa-client';
import { listReviewsForPlace } from '@/lib/reviews-client';
import { formatSeasonMonths } from '@/lib/season';
import type { Question, Review } from '@vivu/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const place = await getPlaceBySlug(params.slug);
    return {
      title: place.titleVi,
      description: place.summaryVi ?? undefined,
      openGraph: {
        title: place.titleVi,
        description: place.summaryVi ?? undefined,
        images: place.heroImageUrl ? [{ url: place.heroImageUrl }] : undefined,
      },
    };
  } catch {
    return { title: 'Địa điểm' };
  }
}

export default async function PlaceDetailPage({ params }: PageProps) {
  let place: Awaited<ReturnType<typeof getPlaceBySlug>>;
  try {
    place = await getPlaceBySlug(params.slug);
  } catch {
    notFound();
  }

  let initialReviews: Review[] = [];
  let initialReviewsTotal = 0;
  try {
    const r = await listReviewsForPlace(params.slug, { pageSize: 20 });
    initialReviews = r.data;
    initialReviewsTotal = r.meta.total;
  } catch {
    /* ignore */
  }

  let initialQuestions: Question[] = [];
  let initialQuestionsTotal = 0;
  try {
    const r = await listQuestionsForPlace(params.slug, { pageSize: 10 });
    initialQuestions = r.data;
    initialQuestionsTotal = r.meta.total;
  } catch {
    /* ignore */
  }

  // Lấy tối đa 6 địa điểm cùng vùng để gợi ý.
  let related: Awaited<ReturnType<typeof listPlaces>>['data'] = [];
  if (place.region) {
    try {
      const r = await listPlaces({ region: place.region.slug, pageSize: 7 });
      related = r.data.filter((p) => p.id !== place.id).slice(0, 6);
    } catch {
      related = [];
    }
  }

  const heroSrc = place.heroImageUrl
    ? (transformCloudinary(place.heroImageUrl, { width: 1600, height: 700 }) ?? place.heroImageUrl)
    : null;
  const photos = place.photos ?? [];
  const galleryPhotos = photos.length > 0 ? photos : null;

  const categoriesText =
    place.categories && place.categories.length > 0
      ? place.categories.map((c) => c.nameVi).join(', ')
      : 'Chưa phân loại';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-overline uppercase tracking-overline text-on-surface-variant"
        >
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <Icon name="chevron_right" className="!text-base" />
          <Link href="/kham-pha" className="hover:text-primary">
            Khám phá
          </Link>
          {place.region && (
            <>
              <Icon name="chevron_right" className="!text-base" />
              <Link href={`/kham-pha?region=${place.region.slug}`} className="hover:text-primary">
                {place.region.nameVi}
              </Link>
            </>
          )}
          <Icon name="chevron_right" className="!text-base" />
          <span className="text-primary">{place.titleVi}</span>
        </nav>

        {/* Title block */}
        <section className="mb-10 mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-h1 text-h1 text-on-surface">
                {place.titleVi}
                {place.titleEn && (
                  <span className="ml-2 font-normal text-on-surface-variant">
                    ({place.titleEn})
                  </span>
                )}
              </h1>
              {place.address && (
                <p className="mt-2 inline-flex items-center gap-1 text-body-md text-on-surface-variant">
                  <Icon name="location_on" className="!text-base text-primary" />
                  {place.address}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <FavoriteButton placeId={place.id} variant="icon" />
              <button
                type="button"
                aria-label="Chia sẻ (sắp ra mắt)"
                disabled
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-md transition-transform disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="share" />
              </button>
            </div>
          </div>
        </section>

        {/* Hero gallery */}
        <section className="mb-12">
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl shadow-lg">
            {heroSrc ? (
              <Image
                src={heroSrc}
                alt={place.titleVi}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-surface-container text-outline">
                <Icon name="image" className="!text-5xl" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          {galleryPhotos && galleryPhotos.length > 1 && (
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {galleryPhotos.slice(0, 8).map((photo) => {
                const thumbSrc =
                  transformCloudinary(photo.url, { width: 240, height: 160 }) ?? photo.url;
                return (
                  <li
                    key={photo.id}
                    className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-outline-variant"
                  >
                    <Image
                      src={thumbSrc}
                      alt={photo.alt ?? place.titleVi}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          {/* Left column */}
          <div className="lg:col-span-8">
            {/* Meta cards */}
            <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetaCard
                icon="calendar_month"
                label="Mùa đẹp nhất"
                value={formatSeasonMonths(place.bestSeasons)}
              />
              <MetaCard icon="explore" label="Vùng miền" value={place.region?.nameVi ?? '—'} />
              <MetaCard icon="category" label="Danh mục" value={categoriesText} />
            </div>

            {/* Description */}
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-h2 text-h2 text-on-surface">Giới thiệu</h2>
                {place.descriptionEn && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 font-semibold text-primary opacity-60"
                    aria-label="Đa ngôn ngữ sắp ra mắt"
                  >
                    <Icon name="translate" className="!text-base" />
                    <span>Xem tiếng Anh</span>
                  </button>
                )}
              </div>
              <div className="prose prose-lg max-w-none whitespace-pre-line text-body-lg leading-relaxed text-on-surface-variant">
                {place.descriptionVi || place.summaryVi || (
                  <span className="italic text-outline">Mô tả chi tiết đang được biên soạn.</span>
                )}
              </div>
            </section>

            {/* Map */}
            <section className="mb-12">
              <h2 className="mb-6 font-h2 text-h2 text-on-surface">Vị trí trên bản đồ</h2>
              <div className="relative flex h-[300px] flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container/40 text-on-surface-variant md:h-[400px]">
                <Icon
                  name="location_on"
                  className="!text-5xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                />
                <p className="mt-2 font-bold text-on-surface">{place.address ?? place.titleVi}</p>
                {place.geo && (
                  <p className="mt-1 text-body-sm">
                    {place.geo.lat.toFixed(4)}°N, {place.geo.lng.toFixed(4)}°E
                  </p>
                )}
                <p className="mt-3 max-w-md px-6 text-center text-body-sm">
                  Bản đồ tương tác sẽ được kích hoạt khi tính năng &quot;/ban-do&quot; lên sàn.
                </p>
              </div>
            </section>

            {/* Reviews */}
            <ReviewsSection
              placeSlug={place.slug}
              initialReviews={initialReviews}
              initialTotal={initialReviewsTotal}
              initialAverage={place.rating?.average ?? 0}
            />

            {/* Q&A */}
            <QaSection
              placeSlug={place.slug}
              initialQuestions={initialQuestions}
              initialTotal={initialQuestionsTotal}
            />
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Best season summary */}
              <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-h4 text-h4 text-on-surface">Thời điểm lý tưởng</h3>
                  <Icon name="wb_sunny" className="text-primary" />
                </div>
                <p className="font-bold text-on-surface">{formatSeasonMonths(place.bestSeasons)}</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {place.bestSeasons.length > 0
                    ? 'Theo gợi ý của ban biên tập Vivu.'
                    : 'Có thể ghé thăm quanh năm.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 rounded-xl border border-outline-variant/30 bg-white p-6 shadow-sm">
                <FavoriteButton placeId={place.id} />
                <AddToCollectionButton placeId={place.id} placeTitle={place.titleVi} />
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-3 font-bold text-on-surface-variant transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Chia sẻ địa điểm (sắp ra mắt)"
                >
                  <Icon name="share" className="!text-base" />
                  <span>Chia sẻ địa điểm</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 py-2 text-body-sm font-medium text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Báo cáo sai thông tin (sắp ra mắt)"
                >
                  <Icon name="report" className="!text-base" />
                  <span>Báo cáo sai thông tin</span>
                </button>
              </div>

              {/* Categories */}
              {place.categories && place.categories.length > 0 && (
                <div className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-sm">
                  <h3 className="mb-3 font-h4 text-h4 text-on-surface">Chủ đề</h3>
                  <ul className="flex flex-wrap gap-2">
                    {place.categories.map((c) => (
                      <li key={c.id}>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-body-sm text-on-secondary-container">
                          {c.icon && <Icon name={c.icon} className="!text-base" />}
                          {c.nameVi}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related places */}
        {related.length > 0 && (
          <section className="mt-section-gap">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-h2 text-h2 text-on-surface">
                Địa điểm khác ở {place.region?.nameVi ?? 'gần đây'}
              </h2>
              <Link
                href={place.region ? `/kham-pha?region=${place.region.slug}` : '/kham-pha'}
                className="font-semibold text-primary hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function MetaCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-outline-variant/30 bg-white p-6 text-center shadow-sm">
      <Icon name={icon} className="!text-3xl text-primary" />
      <span className="mt-3 text-overline uppercase tracking-overline text-on-surface-variant">
        {label}
      </span>
      <span className="mt-1 font-bold text-on-surface">{value}</span>
    </div>
  );
}
