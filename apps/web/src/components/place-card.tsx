import Image from 'next/image';
import type { Place } from '@vivu/types';
import { Icon } from './icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { placeRegionName, placeSummary, placeTitle } from '@/i18n/place';
import { transformCloudinary } from '@/lib/image';

interface PlaceCardProps {
  place: Place;
  locale: Locale;
  /** Link variant: `default` shows full card; `compact` is used in carousels. */
  compact?: boolean;
}

export function PlaceCard({ place, locale, compact = false }: PlaceCardProps) {
  const heroSrc = place.heroImageUrl
    ? (transformCloudinary(place.heroImageUrl, { width: 800, height: 450 }) ?? place.heroImageUrl)
    : null;

  const title = placeTitle(place, locale);
  const summary = placeSummary(place, locale);
  const regionName = place.region ? placeRegionName(place.region, locale) : null;

  return (
    <Link
      href={`/dia-diem/${place.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-shadow hover:shadow-lg"
    >
      <div className={`relative bg-surface-container ${compact ? 'aspect-[4/3]' : 'aspect-video'}`}>
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <Icon name="image" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {regionName && (
          <p className="text-overline uppercase tracking-overline text-secondary">{regionName}</p>
        )}
        <h3 className="font-h4 text-h4 text-on-surface">{title}</h3>
        {summary && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{summary}</p>
        )}
      </div>
    </Link>
  );
}
