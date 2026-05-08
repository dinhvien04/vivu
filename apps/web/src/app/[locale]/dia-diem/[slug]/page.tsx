import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToCollectionButton } from '@/components/add-to-collection-button';
import { FavoriteButton } from '@/components/favorite-button';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { PlaceGallery } from '@/components/place-gallery';
import { QaSection } from '@/components/qa-section';
import { ReviewsSection } from '@/components/reviews-section';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import {
  placeCategoryName,
  placeDescription,
  placeRegionName,
  placeSummary,
  placeTitle,
} from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listPlaces, getPlaceBySlug } from '@/lib/api';
import { listQuestionsForPlace } from '@/lib/qa-client';
import { listReviewsForPlace } from '@/lib/reviews-client';
import { formatSeasonMonths } from '@/lib/season';
import { absoluteUrl } from '@/lib/site-url';
import type { Question, Review } from '@vivu/types';

interface PageProps {
  params: Promise<{ slug: string; locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const place = await getPlaceBySlug(slug);
    const title = placeTitle(place, locale);
    const summary = placeSummary(place, locale);
    return {
      title,
      description: summary ?? undefined,
      alternates: {
        canonical: `/dia-diem/${slug}`,
        languages: {
          vi: `/dia-diem/${slug}`,
          en: `/en/dia-diem/${slug}`,
        },
      },
      openGraph: {
        title,
        description: summary ?? undefined,
        images: place.heroImageUrl ? [{ url: place.heroImageUrl }] : undefined,
      },
    };
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

  // Up to 6 same-region places as related suggestions.
  let related: Awaited<ReturnType<typeof listPlaces>>['data'] = [];
  if (place.region) {
    try {
      const r = await listPlaces({ region: place.region.slug, pageSize: 7 });
      related = r.data.filter((p) => p.id !== place.id).slice(0, 6);
    } catch {
      related = [];
    }
  }

  const photos = place.photos ?? [];
  const title = placeTitle(place, locale);
  const summary = placeSummary(place, locale);
  const description = placeDescription(place, locale);
  const regionName = place.region ? placeRegionName(place.region, locale) : null;

  const categoriesText =
    place.categories && place.categories.length > 0
      ? place.categories.map((c) => placeCategoryName(c, locale)).join(', ')
      : t('place.unclassified');

  // JSON-LD TouristAttraction — surfaces the place to search engines and helps
  // them render rich results. Average rating is included only when at least
  // one visible review exists.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: title,
    description: summary ?? description ?? undefined,
    url: absoluteUrl(`${locale === 'en' ? '/en' : ''}/dia-diem/${place.slug}`),
    image: place.heroImageUrl ? [place.heroImageUrl] : undefined,
    address: place.address
      ? { '@type': 'PostalAddress', streetAddress: place.address, addressCountry: 'VN' }
      : undefined,
    geo: place.geo
      ? { '@type': 'GeoCoordinates', latitude: place.geo.lat, longitude: place.geo.lng }
      : undefined,
    touristType: place.categories?.map((c) => placeCategoryName(c, locale)) ?? undefined,
    aggregateRating:
      place.rating && place.rating.count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: place.rating.average,
            reviewCount: place.rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // The metadata is generated server-side and contains no user input that
        // wasn't already escaped by `JSON.stringify`. Inline JSON-LD is the
        // canonical pattern recommended by Google.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-overline uppercase tracking-overline text-on-surface-variant"
        >
          <Link href="/" className="hover:text-primary">
            {t('place.breadcrumbHome')}
          </Link>
          <Icon name="chevron_right" className="!text-base" />
          <Link href="/kham-pha" className="hover:text-primary">
            {t('place.breadcrumbExplore')}
          </Link>
          {place.region && regionName && (
            <>
              <Icon name="chevron_right" className="!text-base" />
              <Link href={`/kham-pha?region=${place.region.slug}`} className="hover:text-primary">
                {regionName}
              </Link>
            </>
          )}
          <Icon name="chevron_right" className="!text-base" />
          <span className="text-primary">{title}</span>
        </nav>

        {/* Title block */}
        <section className="mb-10 mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-h1 text-h1 text-on-surface">
                {title}
                {locale !== 'en' && place.titleEn && (
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
                aria-label={t('place.shareSoon')}
                disabled
                className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-md transition-transform disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="share" />
              </button>
            </div>
          </div>
        </section>

        {/* Hero gallery */}
        <section className="mb-12">
          <PlaceGallery heroImageUrl={place.heroImageUrl} photos={photos} title={title} />
        </section>

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          {/* Left column */}
          <div className="lg:col-span-8">
            {/* Meta cards */}
            <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetaCard
                icon="calendar_month"
                label={t('place.bestSeason')}
                value={formatSeasonMonths(place.bestSeasons, locale)}
              />
              <MetaCard
                icon="explore"
                label={t('place.region')}
                value={regionName ?? '—'}
              />
              <MetaCard icon="category" label={t('place.category')} value={categoriesText} />
            </div>

            {/* Description */}
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-h2 text-h2 text-on-surface">{t('place.introTitle')}</h2>
              </div>
              <div className="prose prose-lg max-w-none whitespace-pre-line text-body-lg leading-relaxed text-on-surface-variant">
                {description || summary || (
                  <span className="italic text-outline">{t('place.descriptionPending')}</span>
                )}
              </div>
            </section>

            {/* Map */}
            <section className="mb-12">
              <h2 className="mb-6 font-h2 text-h2 text-on-surface">{t('place.mapTitle')}</h2>
              <div className="relative flex h-[300px] flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container/40 text-on-surface-variant md:h-[400px]">
                <Icon
                  name="location_on"
                  className="!text-5xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                />
                <p className="mt-2 font-bold text-on-surface">{place.address ?? title}</p>
                {place.geo && (
                  <p className="mt-1 text-body-sm">
                    {place.geo.lat.toFixed(4)}°N, {place.geo.lng.toFixed(4)}°E
                  </p>
                )}
                <p className="mt-3 max-w-md px-6 text-center text-body-sm">
                  {t('place.mapCta')}{' '}
                  <Link href="/ban-do" className="font-semibold text-primary hover:underline">
                    {t('place.mapCtaLink')}
                  </Link>
                  .
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
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-h4 text-h4 text-on-surface">{t('place.idealTimeTitle')}</h3>
                  <Icon name="wb_sunny" className="text-primary" />
                </div>
                <p className="font-bold text-on-surface">
                  {formatSeasonMonths(place.bestSeasons, locale)}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {place.bestSeasons.length > 0
                    ? t('place.idealTimeNote')
                    : t('place.idealTimeAnyTime')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <FavoriteButton placeId={place.id} />
                <AddToCollectionButton placeId={place.id} placeTitle={title} />
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-3 font-bold text-on-surface-variant transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={t('place.shareSoon')}
                >
                  <Icon name="share" className="!text-base" />
                  <span>{t('place.share')}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 py-2 text-body-sm font-medium text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={t('place.reportSoon')}
                >
                  <Icon name="report" className="!text-base" />
                  <span>{t('place.report')}</span>
                </button>
              </div>

              {/* Categories */}
              {place.categories && place.categories.length > 0 && (
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <h3 className="mb-3 font-h4 text-h4 text-on-surface">{t('place.category')}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {place.categories.map((c) => (
                      <li key={c.id}>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-body-sm text-on-secondary-container">
                          {c.icon && <Icon name={c.icon} className="!text-base" />}
                          {placeCategoryName(c, locale)}
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
                {regionName
                  ? t('place.relatedTitle', { region: regionName })
                  : t('place.relatedTitleNearby')}
              </h2>
              <Link
                href={place.region ? `/kham-pha?region=${place.region.slug}` : '/kham-pha'}
                className="font-semibold text-primary hover:underline"
              >
                {t('common.viewAll')}
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={p} locale={locale} />
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
    <div className="flex flex-col items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 text-center shadow-sm">
      <Icon name={icon} className="!text-3xl text-primary" />
      <span className="mt-3 text-overline uppercase tracking-overline text-on-surface-variant">
        {label}
      </span>
      <span className="mt-1 font-bold text-on-surface">{value}</span>
    </div>
  );
}
