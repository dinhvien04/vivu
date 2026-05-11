'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '../icon';
import type { ComponentProps } from 'react';
import type { PlacesMap } from './places-map';

type Props = ComponentProps<typeof PlacesMap>;

/**
 * Client-side wrapper that lazy-loads the Leaflet map. We need `ssr: false`
 * because Leaflet touches `window` at module evaluation time. The skeleton
 * keeps the same height as the final map so layout doesn't shift.
 */
const LazyPlacesMap = dynamic<Props>(() => import('./places-map').then((m) => m.PlacesMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useTranslations('map');
  return (
    <div
      className="flex w-full items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/50 text-on-surface-variant"
      style={{ height: '70vh' }}
    >
      <div className="flex flex-col items-center gap-3">
        <Icon name="map" className="!text-5xl text-primary" />
        <span className="text-body-md">{t('loading')}</span>
      </div>
    </div>
  );
}

export function PlacesMapLoader(props: Props) {
  return <LazyPlacesMap {...props} />;
}
