'use client';

import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

interface NearbyPlaceActionsProps {
  placeSlug: string;
  sourcePlaceSlug: string;
  locale: 'vi' | 'en';
}

export function NearbyPlaceActions({
  placeSlug,
  sourcePlaceSlug,
  locale,
}: NearbyPlaceActionsProps) {
  const track = (action: 'map' | 'trip_planner') => {
    void trackAnalyticsEvent('nearby_clicked', {
      placeSlug,
      metadata: { sourcePlaceSlug, action },
    });
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link
        href={`/ban-do?place=${placeSlug}`}
        onClick={() => track('map')}
        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-outline-variant px-3 py-2 text-body-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
      >
        <Icon name="map" className="!text-base" />
        {locale === 'en' ? 'Map' : 'Bản đồ'}
      </Link>
      <Link
        href={`/lich-trinh?place=${placeSlug}`}
        onClick={() => track('trip_planner')}
        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary-fixed px-3 py-2 text-body-sm font-semibold text-primary transition hover:bg-primary-fixed-dim"
      >
        <Icon name="add_location_alt" className="!text-base" />
        {locale === 'en' ? 'Add to trip' : 'Thêm vào lịch trình'}
      </Link>
    </div>
  );
}
