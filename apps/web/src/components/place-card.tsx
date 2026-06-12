import Image from 'next/image';
import type { Place } from '@vivu/types';
import { Icon } from './icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { placeSummary, placeTitle } from '@/i18n/place';
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
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary-container to-surface-container-high text-primary">
            <span className="px-6 text-center font-h4 text-h4">{title}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-overline uppercase tracking-overline text-primary">
            {place.province || 'Gia Lai'}
          </span>
          {place.rating && place.rating.count > 0 && (
            <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-on-surface">
              <Icon name="star" className="!text-base text-amber-500" />
              {place.rating.average.toFixed(1)}
              <span className="font-normal text-on-surface-variant">({place.rating.count})</span>
            </span>
          )}
        </div>
        <h3 className="font-h4 text-h4 text-on-surface">{title}</h3>
        {summary && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{summary}</p>
        )}
      </div>
    </Link>
  );
}
