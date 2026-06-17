import Image from 'next/image';
import type { Place } from '@vivu/types';
import { Icon } from './icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { placeSummary, placeTitle } from '@/i18n/place';
import { transformCloudinary } from '@/lib/image';
import { hasPlaceImage } from '@/lib/place-image';

interface PlaceCardProps {
  place: Place;
  locale: Locale;
  /** Link variant: `default` shows full card; `compact` is used in carousels. */
  compact?: boolean;
}

export function PlaceCard({ place, locale, compact = false }: PlaceCardProps) {
  if (!hasPlaceImage(place)) return null;

  const heroSrc =
    transformCloudinary(place.heroImageUrl, { width: 800, height: 450 }) ?? place.heroImageUrl;

  const title = placeTitle(place, locale);
  const summary = placeSummary(place, locale);
  const badges = [
    locale === 'en' ? 'Image' : 'Có ảnh',
    place.geo ? (locale === 'en' ? 'Coordinates' : 'Có tọa độ') : null,
    place.isAiReady ? (locale === 'en' ? 'AI data' : 'Có dữ liệu AI') : null,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <Link
      href={`/dia-diem/${place.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-shadow hover:shadow-lg"
    >
      <div className={`relative bg-surface-container ${compact ? 'aspect-[4/3]' : 'aspect-video'}`}>
        <Image
          src={heroSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
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
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-surface-container px-2 py-1 text-[11px] font-semibold text-on-surface-variant"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
