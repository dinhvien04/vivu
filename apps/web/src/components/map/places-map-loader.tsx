'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '../icon';
import { Component, type ComponentProps, type ReactNode } from 'react';
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

function MapLoading({ height = '70vh' }: { height?: string }) {
  const t = useTranslations('map');
  return (
    <div
      className="flex w-full items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/50 text-on-surface-variant"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-3">
        <Icon name="map" className="!text-5xl text-primary" />
        <span className="text-body-md">{t('loading')}</span>
      </div>
    </div>
  );
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function MapErrorFallback({ height, locale }: Pick<Props, 'height' | 'locale'>) {
  const isEn = locale === 'en';
  return (
    <div
      className="flex w-full items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/50 px-6 text-center text-on-surface-variant"
      style={{ height: height ?? '70vh' }}
    >
      <div className="flex max-w-md flex-col items-center gap-3">
        <Icon name="map" className="!text-5xl text-primary" />
        <h2 className="font-h4 text-h4 text-on-surface">
          {isEn ? 'Could not load the map' : 'Không tải được bản đồ'}
        </h2>
        <p className="text-body-md">
          {isEn
            ? 'Please refresh the page or try again later.'
            : 'Vui lòng tải lại trang hoặc thử lại sau ít phút.'}
        </p>
      </div>
    </div>
  );
}

export function PlacesMapLoader(props: Props) {
  return (
    <MapErrorBoundary fallback={<MapErrorFallback height={props.height} locale={props.locale} />}>
      <LazyPlacesMap {...props} />
    </MapErrorBoundary>
  );
}
