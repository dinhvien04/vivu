'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export function PlaceViewTracker({ placeSlug }: { placeSlug: string }) {
  useEffect(() => {
    void trackAnalyticsEvent('place_view', { placeSlug });
  }, [placeSlug]);

  return null;
}
