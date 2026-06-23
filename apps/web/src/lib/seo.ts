import type { Metadata } from 'next';
import type { Place } from '@vivu/types';
import { placeCategoryName } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { absoluteUrl } from './site-url';

export function localizedCanonical(path: string, locale: Locale): string {
  return locale === 'en' ? `/en${path}` : path;
}

export function buildPlaceMetadata(input: {
  slug: string;
  title: string;
  summary: string | null;
  heroImageUrl: string | null;
}): Metadata {
  return {
    title: input.title,
    description: input.summary ?? undefined,
    alternates: {
      canonical: `/dia-diem/${input.slug}`,
      languages: {
        vi: `/dia-diem/${input.slug}`,
        en: `/en/dia-diem/${input.slug}`,
      },
    },
    openGraph: {
      title: input.title,
      description: input.summary ?? undefined,
      images: input.heroImageUrl ? [{ url: input.heroImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.summary ?? undefined,
      images: input.heroImageUrl ? [input.heroImageUrl] : undefined,
    },
  };
}

export function buildTouristAttractionJsonLd(input: {
  place: Place;
  title: string;
  description: string | null;
  locale: Locale;
}) {
  const { place, title, description, locale } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: title,
    description: description ?? undefined,
    url: absoluteUrl(localizedCanonical(`/dia-diem/${place.slug}`, locale)),
    image: place.heroImageUrl ? [place.heroImageUrl] : undefined,
    address: place.address
      ? { '@type': 'PostalAddress', streetAddress: place.address, addressCountry: 'VN' }
      : undefined,
    geo: place.geo
      ? { '@type': 'GeoCoordinates', latitude: place.geo.lat, longitude: place.geo.lng }
      : undefined,
    touristType:
      place.categories?.map((category) => placeCategoryName(category, locale)) ?? undefined,
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
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  locale: Locale,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedCanonical(item.path, locale)),
    })),
  };
}
