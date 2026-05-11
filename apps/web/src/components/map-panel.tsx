'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { Place } from '@vivu/types';
import { Icon } from '@/components/icon';
import type { Locale } from '@/i18n/routing';

export interface RegionOption {
  slug: string;
  name: string;
}

export interface CategoryOption {
  slug: string;
  name: string;
  icon: string | null;
}

export interface MapPanelMessages {
  filtersTitle: string;
  filterRegion: string;
  filterCategory: string;
  noFilters: string;
  layerHint: string;
  noGeoPlaces: string;
}

interface MapPanelProps {
  locale: Locale;
  places: Place[];
  regions: RegionOption[];
  categories: CategoryOption[];
  messages: MapPanelMessages;
}

/**
 * Heavy Leaflet bundle lives in `PlacesMap`; we only load it once the
 * component mounts on the client. SSR is disabled because Leaflet
 * touches `window` during module init.
 */
const PlacesMap = dynamic(() => import('./map/places-map').then((m) => m.PlacesMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container">
      <span className="text-on-surface-variant">…</span>
    </div>
  ),
});

export function MapPanel({ locale, places, regions, categories, messages }: MapPanelProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (activeRegion && p.region?.slug !== activeRegion) return false;
      if (activeCategory && !p.categories?.some((c) => c.slug === activeCategory)) return false;
      return true;
    });
  }, [places, activeRegion, activeCategory]);

  return (
    <div className="grid gap-gutter lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
        <h2 className="mb-4 font-h3 text-h3 text-on-surface">{messages.filtersTitle}</h2>

        <section className="mb-5">
          <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
            {messages.filterRegion}
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label={messages.noFilters}
              active={activeRegion === null}
              onClick={() => setActiveRegion(null)}
            />
            {regions.map((r) => (
              <FilterChip
                key={r.slug}
                label={r.name}
                active={activeRegion === r.slug}
                onClick={() => setActiveRegion(activeRegion === r.slug ? null : r.slug)}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-overline uppercase tracking-overline text-on-surface-variant">
            {messages.filterCategory}
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label={messages.noFilters}
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map((c) => (
              <FilterChip
                key={c.slug}
                label={c.name}
                icon={c.icon}
                active={activeCategory === c.slug}
                onClick={() => setActiveCategory(activeCategory === c.slug ? null : c.slug)}
              />
            ))}
          </div>
        </section>

        <p className="mt-6 text-body-sm text-on-surface-variant">{messages.layerHint}</p>
      </aside>

      <PlacesMap places={filtered} locale={locale} height="600px" />
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm transition ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-primary/60'
      }`}
    >
      {icon ? <Icon name={icon} className="!text-base" /> : null}
      {label}
    </button>
  );
}
