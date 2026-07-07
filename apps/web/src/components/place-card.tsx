import type { Place } from '@vivu/types';
import { Icon } from './icon';
import { LoadableImage } from './loadable-image';
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
  const usesVietnameseFallback = locale === 'en' && (!place.titleEn || !place.summaryEn);
  const badges = [
    usesVietnameseFallback ? 'Vietnamese copy' : null,
    locale === 'en' ? 'Image' : 'Có ảnh',
    place.geo ? (locale === 'en' ? 'Coordinates' : 'Có tọa độ') : null,
    place.isAiReady ? (locale === 'en' ? 'AI data' : 'Có dữ liệu AI') : null,
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <Link
      href={`/dia-diem/${place.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
    >
      <div className="relative bg-surface-container aspect-[4/3] w-full overflow-hidden">
        <LoadableImage
          src={heroSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          wrapperClassName="absolute inset-0"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {place.province || 'Gia Lai'}
          </span>
          {place.rating && place.rating.count > 0 && (
            <span className="inline-flex items-center gap-1 text-body-sm font-bold text-on-surface">
              <Icon name="star" className="!text-base text-amber-500 animate-pulse" />
              {place.rating.average.toFixed(1)}
              <span className="font-normal text-on-surface-variant text-xs">
                ({place.rating.count})
              </span>
            </span>
          )}
        </div>
        <h3 className="font-bold text-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {summary && (
          <p className="line-clamp-2 text-body-sm text-on-surface-variant leading-relaxed">
            {summary}
          </p>
        )}
        <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-primary/5 border border-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-wide"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
