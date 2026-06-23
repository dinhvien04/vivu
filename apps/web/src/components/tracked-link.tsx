'use client';

import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { trackAnalyticsEvent, type AnalyticsEventType } from '@/lib/analytics-client';

type LocaleLinkProps = ComponentProps<typeof Link>;

type TrackedLinkProps = LocaleLinkProps & {
  analyticsMetadata?: Record<string, unknown>;
  eventType: AnalyticsEventType;
  placeSlug?: string;
};

export function TrackedLink({
  analyticsMetadata,
  eventType,
  onClick,
  placeSlug,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        void trackAnalyticsEvent(eventType, {
          metadata: analyticsMetadata,
          placeSlug,
        });
        onClick?.(event);
      }}
    />
  );
}
