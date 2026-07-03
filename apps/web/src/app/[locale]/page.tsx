import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/icon';
import { LoadableImage } from '@/components/loadable-image';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TrackedLink } from '@/components/tracked-link';
import { AiChatWidget } from '@/features/ai-chat/components/AiChatWidget';
import { Link } from '@/i18n/navigation';
import { placeSummary, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listPlaces, type Place } from '@/lib/api';
import { transformCloudinary } from '@/lib/image';
import { safeJsonLd } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site-url';

interface FeaturedCollection {
  title: string;
  href: string;
  image: string | null;
  alt: string;
}

const HOME_HERO_PRIORITY_SLUGS = [
  'eo-gio',
  'cu-lao-xanh',
  'bien-ho',
  'bien-ho-che',
  'thap-banh-it',
  'dam-thi-nai',
  'bien-quy-nhon',
  'bao-tang-quang-trung',
  'doi-co-hong-dak-doa',
  'bai-xep',
  'hon-kho',
  'ky-co',
];

async function loadHomeData(locale: Locale): Promise<{
  hero: Place | null;
  collections: FeaturedCollection[];
}> {
  const result = await listPlaces({
    province: 'Gia Lai',
    pageSize: 80,
    sort: 'recent',
  }).catch(() => null);
  const places = result?.data ?? [];
  const hero =
    HOME_HERO_PRIORITY_SLUGS.map((slug) =>
      places.find((place) => place.slug === slug && place.heroImageUrl),
    ).find(Boolean) ??
    places.find((place) => place.heroImageUrl) ??
    places[0] ??
    null;
  const collections = places
    .filter((place) => place.id !== hero?.id && place.heroImageUrl)
    .slice(0, 4)
    .map((place) => {
      const title = placeTitle(place, locale);
      return {
        title,
        href: `/dia-diem/${place.slug}`,
        image: transformCloudinary(place.heroImageUrl, {
          width: 600,
          height: 800,
          crop: 'fill',
        }),
        alt: title,
      };
    });

  return { hero, collections };
}

// The page depends on the places API, so it can be prerendered with a 60-second revalidation period.
export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const { hero, collections } = await loadHomeData(locale);
  const heroImage = transformCloudinary(hero?.heroImageUrl ?? null, {
    width: 1200,
    height: 900,
    crop: 'fill',
  });
  const heroAlt = hero ? placeTitle(hero, locale) : t('home.heroFallbackAlt');
  const heroSummary = hero ? placeSummary(hero, locale) : null;
  const heroHref = hero ? `/dia-diem/${hero.slug}` : '/kham-pha';

  const PROCESS_STEPS = [
    { icon: 'tune', label: t('home.processStep1') },
    { icon: 'auto_awesome', label: t('home.processStep2') },
    { icon: 'map', label: t('home.processStep3') },
    { icon: 'support_agent', label: t('home.processStep4') },
  ];
  const homePath = locale === 'en' ? '/en' : '/';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vivu',
      url: absoluteUrl(homePath),
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Vivu',
      url: absoluteUrl(homePath),
      logo: absoluteUrl('/vivu-logo.png'),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        {/* Hero */}
        <section className="flex flex-col items-center gap-12 py-section-gap md:flex-row">
          <div className="flex-1 space-y-6">
            <h1 className="font-h1 text-h1 text-on-surface">{t('home.heroTitle')}</h1>
            <p className="max-w-2xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
              {t('home.heroLead')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
              <TrackedLink
                href="/lich-trinh"
                eventType="home_trip_planner_cta_clicked"
                analyticsMetadata={{ surface: 'hero' }}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-body-md font-semibold text-on-primary shadow-premium transition-all hover:scale-[1.03] hover:bg-primary/90 hover:shadow-hover active:scale-95"
              >
                {t('home.heroCta')}
              </TrackedLink>
              <Link
                href="/kham-pha"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-outline px-8 text-body-md font-semibold text-on-surface transition-all hover:border-primary hover:text-primary active:scale-95"
              >
                {t('home.exploreCta')}
              </Link>
              <TrackedLink
                href="/tu-van?source=home"
                eventType="home_consulting_cta_clicked"
                analyticsMetadata={{ surface: 'hero' }}
                className="inline-flex h-12 items-center justify-center gap-1 text-body-md font-semibold text-primary transition-all hover:underline"
              >
                <span>{t('home.consultCta')}</span>
                <Icon name="arrow_forward" className="!text-lg" />
              </TrackedLink>
            </div>
          </div>
          <Link
            href={heroHref}
            className="group relative aspect-[4/3] w-full flex-1 overflow-hidden rounded-xl shadow-premium"
          >
            {heroImage ? (
              <LoadableImage
                src={heroImage}
                alt={heroAlt}
                loading="eager"
                decoding="async"
                wrapperClassName="absolute inset-0"
                className="h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-container via-tertiary-container to-secondary-container">
                <Icon name="travel_explore" className="!text-6xl text-primary" />
              </div>
            )}
            {/* Dark gradient overlay for bottom text readability */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {hero && (
              <div className="absolute bottom-0 inset-x-0 z-20 px-6 pb-6 pt-12 text-white">
                <p className="text-label-caps uppercase text-primary-fixed font-semibold tracking-wider">
                  {t('home.heroPick')}
                </p>
                <p className="font-h3 text-2xl font-bold mt-1">{placeTitle(hero, locale)}</p>
                {heroSummary && (
                  <p className="text-body-md mt-2 line-clamp-2 text-white/90 font-light">
                    {heroSummary}
                  </p>
                )}
              </div>
            )}
          </Link>
        </section>

        {/* Business flow */}
        <section className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="font-h2 text-h2 text-on-surface">{t('home.processTitle')}</h2>
            <TrackedLink
              href="/lich-trinh"
              eventType="home_trip_planner_cta_clicked"
              analyticsMetadata={{ surface: 'process' }}
              className="font-semibold text-primary hover:underline"
            >
              {t('home.heroCta')}
            </TrackedLink>
          </div>
          <ol className="grid gap-4 md:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => (
              <li
                key={step.label}
                className="rounded-2xl border border-outline-variant/30 bg-surface p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <Icon name={step.icon} />
                </div>
                <p className="text-overline uppercase tracking-overline text-primary">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-body-lg font-bold text-on-surface">{step.label}</h3>
              </li>
            ))}
          </ol>
        </section>

        {/* Feature cards */}
        <section className="py-section-gap">
          <div className="mb-16 text-center">
            <h2 className="font-h2 text-h2 text-on-surface">{t('home.toolsTitle')}</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-primary-container" />
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {/* Card 1 */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="travel_explore" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">{t('home.card1Title')}</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">{t('home.card1Body')}</p>
              <Link href="/kham-pha" className="font-semibold text-primary hover:underline">
                {t('home.exploreCta')}
              </Link>
            </article>

            {/* Card 2 */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="route" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">{t('home.card2Title')}</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">{t('home.card2Body')}</p>
              <TrackedLink
                href="/lich-trinh"
                eventType="home_trip_planner_cta_clicked"
                analyticsMetadata={{ surface: 'tool_card' }}
                className="group/cta relative block h-32 w-full overflow-hidden rounded-lg border border-outline-variant/30 bg-gradient-to-br from-primary-container via-tertiary-container to-secondary-container transition-all hover:border-primary/60"
                aria-label={t('home.card2Cta')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    name="auto_awesome"
                    className="!text-6xl text-primary opacity-40 transition-transform group-hover/cta:scale-110"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-primary/85 px-4 py-2 text-on-primary backdrop-blur-sm">
                  <span className="text-label-caps font-semibold">{t('home.card2Cta')}</span>
                  <Icon name="arrow_forward" className="!text-base" />
                </div>
              </TrackedLink>
            </article>

            {/* Card 3 */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="support_agent" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">{t('home.card3Title')}</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">{t('home.card3Body')}</p>
              <TrackedLink
                href="/tu-van?source=home"
                eventType="home_consulting_cta_clicked"
                analyticsMetadata={{ surface: 'tool_card' }}
                className="font-semibold text-primary hover:underline"
              >
                {t('home.consultCta')}
              </TrackedLink>
            </article>
          </div>
        </section>

        {/* Featured Collections */}
        {collections.length > 0 && (
          <section className="border-t border-outline-variant/20 py-section-gap">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-label-caps uppercase text-primary">
                  {t('home.todayHint')}
                </span>
                <h2 className="mt-2 font-h2 text-h2 text-on-surface">
                  {t('home.inspirationTitle')}
                </h2>
              </div>
              <Link
                href="/kham-pha"
                className="hidden font-semibold text-primary hover:underline sm:inline"
              >
                {t('home.viewAllPlaces')}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              {collections.map((c) => (
                <Link key={c.title} href={c.href} className="group cursor-pointer">
                  <div className="mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-surface-container shadow-sm transition-all group-hover:shadow-premium">
                    {c.image ? (
                      <LoadableImage
                        src={c.image}
                        alt={c.alt}
                        loading="lazy"
                        decoding="async"
                        wrapperClassName="h-full w-full"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container to-tertiary-container">
                        <Icon name="image" className="!text-4xl text-primary opacity-50" />
                      </div>
                    )}
                  </div>
                  <p className="mb-1 text-label-caps text-on-surface-variant">GIA LAI</p>
                  <h4 className="font-h3 text-xl font-bold transition-colors group-hover:text-primary">
                    {c.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <AiChatWidget />
      <SiteFooter />
    </>
  );
}
