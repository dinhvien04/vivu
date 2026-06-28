import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToCollectionButton } from '@/components/add-to-collection-button';
import { FavoriteButton } from '@/components/favorite-button';
import { Icon } from '@/components/icon';
import { PlacesMapLoader } from '@/components/map/places-map-loader';
import { NearbyPlaceActions } from '@/components/nearby-place-actions';
import { PlaceCard } from '@/components/place-card';
import { PlaceGallery } from '@/components/place-gallery';
import { PlaceShareActions } from '@/components/place-share-actions';
import { PlaceViewTracker } from '@/components/place-view-tracker';
import { QaSection } from '@/components/qa-section';
import { ReviewsSection } from '@/components/reviews-section';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TrackedLink } from '@/components/tracked-link';
import { WeatherWidget } from '@/components/weather-widget';
import { DataReportButton } from '@/features/data-reports/components/DataReportButton';
import { Link } from '@/i18n/navigation';
import { placeCategoryName, placeDescription, placeSummary, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listPlaces, getPlaceBySlug, listPlaceImages, listPlacesNearby } from '@/lib/api';
import { listQuestionsForPlace } from '@/lib/qa-client';
import { listReviewsForPlace } from '@/lib/reviews-client';
import { formatSeasonMonths } from '@/lib/season';
import {
  buildBreadcrumbJsonLd,
  buildPlaceMetadata,
  buildTouristAttractionJsonLd,
  safeJsonLd,
} from '@/lib/seo';
import type { Question, Review } from '@vivu/types';

interface PageProps {
  params: Promise<{ slug: string; locale: Locale }>;
}

function firstPublicParagraph(value: string | null): string | null {
  if (!value) return null;
  const paragraph = value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .find(
      (item) =>
        item.length > 0 &&
        !/chatbot|rag|khi xây dựng|nguồn du lịch|chuẩn hóa|bộ dữ liệu/i.test(item),
    );
  if (!paragraph) return null;
  return paragraph.length > 700 ? `${paragraph.slice(0, 697).trimEnd()}...` : paragraph;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const place = await getPlaceBySlug(slug);
    const title = placeTitle(place, locale);
    const summary = placeSummary(place, locale);
    return buildPlaceMetadata({ slug, title, summary, heroImageUrl: place.heroImageUrl });
  } catch {
    const t = await getTranslations({ locale, namespace: 'place' });
    return { title: t('errorTitle') };
  }
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let place: Awaited<ReturnType<typeof getPlaceBySlug>>;
  try {
    place = await getPlaceBySlug(slug);
  } catch {
    notFound();
  }

  let initialReviews: Review[] = [];
  let initialReviewsTotal = 0;
  try {
    const r = await listReviewsForPlace(slug, { pageSize: 20 });
    initialReviews = r.data;
    initialReviewsTotal = r.meta.total;
  } catch {
    /* ignore */
  }

  let initialQuestions: Question[] = [];
  let initialQuestionsTotal = 0;
  try {
    const r = await listQuestionsForPlace(slug, { pageSize: 10 });
    initialQuestions = r.data;
    initialQuestionsTotal = r.meta.total;
  } catch {
    /* ignore */
  }

  // Up to 6 related suggestions: prefer geographic neighbours when this place
  // has coordinates, otherwise fall back to same-region recents.
  type Related = Awaited<ReturnType<typeof listPlaces>>['data'][number] & { distanceKm?: number };
  let related: Related[] = [];
  let relatedMode: 'nearby' | 'region' = 'region';
  if (place.geo) {
    try {
      const nearby = await listPlacesNearby({
        lat: place.geo.lat,
        lng: place.geo.lng,
        radius: 200,
        limit: 6,
        excludeSlug: place.slug,
      });
      if (nearby.length > 0) {
        related = nearby;
        relatedMode = 'nearby';
      }
    } catch {
      /* fall through to region-based suggestion */
    }
  }
  if (related.length === 0) {
    try {
      const r = await listPlaces({ province: 'Gia Lai', pageSize: 7 });
      related = r.data.filter((p) => p.id !== place.id).slice(0, 6);
    } catch {
      related = [];
    }
  }

  const imageResults = await listPlaceImages(slug).catch(() => []);
  const photos =
    imageResults.length > 0
      ? imageResults.map((image) => ({
          ...image,
          publicId: null,
          width: null,
          height: null,
        }))
      : (place.photos ?? []);
  const title = placeTitle(place, locale);
  const summary = placeSummary(place, locale);
  const description = placeDescription(place, locale);
  const publicDescription = summary ?? firstPublicParagraph(description);
  const usesVietnameseFallback =
    locale === 'en' && (!place.titleEn || !place.summaryEn || !place.descriptionEn);

  const categoriesText =
    place.categories && place.categories.length > 0
      ? place.categories.map((c) => placeCategoryName(c, locale)).join(', ')
      : t('place.unclassified');

  // JSON-LD TouristAttraction — surfaces the place to search engines and helps
  // them render rich results. Average rating is included only when at least
  // one visible review exists.
  const jsonLd = buildTouristAttractionJsonLd({
    place,
    title,
    description: publicDescription,
    locale,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: t('place.breadcrumbHome'), path: '/' },
      { name: t('place.breadcrumbExplore'), path: '/kham-pha' },
      { name: title, path: `/dia-diem/${place.slug}` },
    ],
    locale,
  );

  return (
    <>
      <PlaceViewTracker placeSlug={place.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12 space-y-16">
        
        {/* 1. HERO SECTION WITH IMAGE & GLASSMORPHISM OVERLAY */}
        <section className="relative overflow-hidden rounded-3xl shadow-2xl bg-surface-container-high group border border-outline-variant/30">
          {/* Gallery Background */}
          <div className="relative z-0">
            <PlaceGallery heroImageUrl={place.heroImageUrl} photos={photos} title={title} />
          </div>

          {/* Floating glassmorphic info card with enhanced gradient overlays */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent p-6 md:p-8 pt-32 text-white flex flex-col md:flex-row md:items-end md:justify-between gap-6 pointer-events-none"
          >
            <div className="space-y-4 pointer-events-auto max-w-3xl">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60"
              >
                <Link href="/" className="hover:text-white transition-colors">
                  {t('place.breadcrumbHome')}
                </Link>
                <Icon name="chevron_right" className="!text-sm text-white/30" />
                <Link href="/kham-pha" className="hover:text-white transition-colors">
                  {t('place.breadcrumbExplore')}
                </Link>
                <Icon name="chevron_right" className="!text-sm text-white/30" />
                <span className="text-white/80 font-black">{title}</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg leading-tight">
                  {title}
                  {locale !== 'en' && place.titleEn && (
                    <span className="block md:inline-block md:ml-4 text-xl md:text-3xl font-medium text-white/65">
                      ({place.titleEn})
                    </span>
                  )}
                </h1>

                {place.address && (
                  <p className="inline-flex items-center gap-2 text-sm md:text-lg text-white/75">
                    <Icon name="location_on" className="!text-xl text-primary" />
                    <span>{place.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap gap-3 pointer-events-auto">
              <Link
                href={`/lich-trinh?place=${place.slug}`}
                className="flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-4 font-bold text-on-primary transition-all hover:bg-primary/95 hover:scale-105 active:scale-95 shadow-lg hover:shadow-primary/20"
              >
                <Icon name="route" className="!text-xl" />
                <span>{t('place.planTrip')}</span>
              </Link>
              <Link
                href={`/ai-chat?place=${place.slug}`}
                className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 font-bold text-white transition-all hover:bg-white/25 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Icon name="auto_awesome" className="!text-xl" />
                <span>{t('place.askAi')}</span>
              </Link>
              <div className="flex gap-2">
                <FavoriteButton placeId={place.id} variant="icon" />
                <PlaceShareActions title={title} variant="icon" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUICK INFO GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickInfoCard 
            icon="location_on" 
            label={t('place.region') || "Khu vực"} 
            value={place.region ? (locale === 'en' ? place.region.nameEn : place.region.nameVi) : "Gia Lai"} 
          />
          <QuickInfoCard 
            icon="calendar_month" 
            label={t('place.bestSeason')} 
            value={formatSeasonMonths(place.bestSeasons, locale)} 
          />
          <QuickInfoCard 
            icon="category" 
            label={t('place.category')} 
            value={categoriesText} 
          />
          <QuickInfoCard 
            icon="payments" 
            label="Giá vé" 
            value="Miễn phí" 
          />
        </section>

        {/* 3. TWO COLUMN CONTENT */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column (Main Info) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Description */}
            <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
              <h2 className="text-2xl font-bold text-on-surface border-b pb-4 border-outline-variant/30">
                {t('place.introTitle')}
              </h2>
              {usesVietnameseFallback && (
                <p className="rounded-xl border border-primary/30 bg-primary-fixed px-4 py-3 text-body-sm text-on-primary-fixed">
                  English copy for this destination is still being updated. Vivu is showing the
                  available Vietnamese content for now.
                </p>
              )}
              <div className="prose prose-lg max-w-none whitespace-pre-line text-body-lg leading-relaxed text-on-surface-variant">
                {publicDescription || (
                  <span className="italic text-outline">{t('place.descriptionPending')}</span>
                )}
              </div>
            </section>

            {/* Map & Directions */}
            <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-outline-variant/30">
                <h2 className="text-2xl font-bold text-on-surface">{t('place.mapTitle')}</h2>
                {place.geo && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.geo.lat},${place.geo.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline transition-all"
                  >
                    <Icon name="navigation" className="!text-sm" />
                    <span>Chỉ đường</span>
                  </a>
                )}
              </div>
              {place.geo ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border border-outline-variant/30">
                    <PlacesMapLoader
                      places={[place]}
                      locale={locale}
                      center={[place.geo.lat, place.geo.lng]}
                      zoom={12}
                      height="380px"
                    />
                  </div>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                    <Icon name="explore" className="!text-base text-primary" />
                    <span className="font-semibold text-on-surface">{place.geo.lat.toFixed(4)}°N, {place.geo.lng.toFixed(4)}°E</span>
                    <span className="text-outline">·</span>
                    <Link href="/ban-do" className="font-semibold text-primary hover:underline">
                      {t('place.mapCtaLink')}
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="relative flex h-[300px] flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container/40 text-on-surface-variant md:h-[350px]">
                  <Icon
                    name="location_on"
                    className="!text-5xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  />
                  <p className="mt-2 font-bold text-on-surface">{place.address ?? title}</p>
                  <p className="mt-3 max-w-md px-6 text-center text-body-sm">
                    {t('place.mapMissingGeo')}
                  </p>
                </div>
              )}
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

          {/* Right Column (Sidebar Utilities) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Weather Widget */}
            {place.geo && <WeatherWidget lat={place.geo.lat} lng={place.geo.lng} />}

            {/* Action Tools */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-on-surface border-b pb-2 border-outline-variant/30">Tiện ích</h3>
              <AddToCollectionButton placeId={place.id} placeTitle={title} />
              <DataReportButton placeSlug={place.slug} placeTitle={title} />
            </div>

            {/* Categories tags list */}
            {place.categories && place.categories.length > 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-on-surface border-b pb-2 border-outline-variant/30">{t('place.category')}</h3>
                <ul className="flex flex-wrap gap-2">
                  {place.categories.map((c) => (
                    <li key={c.id}>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3.5 py-1 text-xs font-bold text-on-secondary-container">
                        {c.icon && <Icon name={c.icon} className="!text-sm" />}
                        {placeCategoryName(c, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* 4. CONVERSION CTAS SECTION */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary-container/20 to-surface-container-high p-8 md:p-14 rounded-3xl border border-outline-variant/30 text-center space-y-8 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight leading-tight">
              Bắt đầu hành trình của bạn tại {title}
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Lập kế hoạch lịch trình cá nhân hóa tức thì với AI Trip Planner, nhận tư vấn miễn phí từ đội ngũ chuyên gia hoặc chat trực tuyến về điểm đến này.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/lich-trinh?place=${place.slug}`}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4.5 font-bold text-on-primary transition-all hover:bg-primary/95 hover:scale-105 active:scale-95 shadow-lg hover:shadow-primary/20"
            >
              <Icon name="route" className="!text-xl" />
              <span>Tạo lịch trình có địa danh này</span>
            </Link>
            
            <Link
              href={`/ai-chat?place=${place.slug}`}
              className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest border border-outline-variant px-8 py-4.5 font-bold text-on-surface transition-all hover:bg-surface hover:scale-105 active:scale-95 shadow-md"
            >
              <Icon name="auto_awesome" className="!text-xl text-primary" />
              <span>Chat với Vivu AI về nơi này</span>
            </Link>

            <TrackedLink
              href={`/tu-van?source=place_detail&place=${place.slug}&placeName=${encodeURIComponent(title)}`}
              eventType="detail_consulting_clicked"
              placeSlug={place.slug}
              className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest border border-outline-variant px-8 py-4.5 font-bold text-on-surface transition-all hover:bg-surface hover:scale-105 active:scale-95 shadow-md"
            >
              <Icon name="support_agent" className="!text-xl text-primary" />
              <span>Gửi yêu cầu tư vấn chuyến đi</span>
            </TrackedLink>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-sm font-semibold text-on-surface-variant/80 border-t border-outline-variant/30 max-w-lg mx-auto">
            <span className="flex items-center gap-1">
              <Icon name="check_circle" className="!text-base text-primary" />
              <span>Miễn phí sử dụng</span>
            </span>
            <span className="flex items-center gap-1">
              <Icon name="check_circle" className="!text-base text-primary" />
              <span>Dữ liệu xác thực bởi Vivu</span>
            </span>
            <span className="flex items-center gap-1">
              <Icon name="check_circle" className="!text-base text-primary" />
              <span>Hỗ trợ tư vấn 24/7</span>
            </span>
          </div>
        </section>

        {/* 5. NEARBY PLACES */}
        {related.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-outline-variant/30">
              <h2 className="text-2xl font-bold text-on-surface">
                {relatedMode === 'nearby'
                  ? t('place.relatedTitleNearby')
                  : t('place.relatedTitleNearby')}
              </h2>
              <Link href="/kham-pha" className="font-semibold text-primary hover:underline flex items-center gap-1 transition-all">
                <span>{t('common.viewAll')}</span>
                <Icon name="arrow_forward" className="!text-sm" />
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((p) => (
                <li key={p.id} className="relative group overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all">
                  <PlaceCard place={p} locale={locale} />
                  <NearbyPlaceActions
                    placeSlug={p.slug}
                    sourcePlaceSlug={place.slug}
                    locale={locale}
                  />
                  {typeof p.distanceKm === 'number' && (
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-surface-container/95 px-2.5 py-1 text-xs font-bold text-on-surface shadow-sm">
                      {t('place.distanceKm', { km: p.distanceKm.toFixed(1) })}
                    </span>
                  )}
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

function QuickInfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
        <Icon name={icon} className="!text-2xl" />
      </div>
      <div>
        <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/75">
          {label}
        </span>
        <span className="block font-black text-on-surface text-sm md:text-base mt-0.5">
          {value}
        </span>
      </div>
    </div>
  );
}
