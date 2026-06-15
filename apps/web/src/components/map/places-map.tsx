'use client';

import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTranslations } from 'next-intl';
import type { Place } from '@vivu/types';
import { Icon } from '../icon';
import { useTheme } from '../theme-provider';
import { placeCategoryName, placeRegionName, placeSummary, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';

interface PlacesMapProps {
  places: Place[];
  /** Active locale — controls popup labels and place text. */
  locale: Locale;
  /** Initial map centre (lat, lng). Defaults to Gia Lai. */
  center?: [number, number];
  /** Initial zoom. */
  zoom?: number;
  /** Auto-fit the map to the markers on first render. Default `true`. */
  fitToMarkers?: boolean;
  /** Render height — must be a fixed CSS dimension (Leaflet needs concrete size). */
  height?: string;
}

const GIA_LAI_CENTER: [number, number] = [14.05, 108.45];
const DEFAULT_ZOOM = 8;

interface TileLayerSpec {
  url: string;
  attribution: string;
  maxZoom: number;
}

const TILE_LAYERS: Record<'standard' | 'satellite' | 'terrain', TileLayerSpec> = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | Tiles &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
};

/** Build the default Leaflet pin icon without relying on bundled image paths. */
function makeDefaultIcon(): L.Icon {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

interface ClusterProps {
  places: Place[];
  locale: Locale;
  popupViewLabel: string;
  detailHrefPrefix: string;
  onSelect(place: Place): void;
}

/**
 * Renders all place markers inside a `leaflet.markercluster` group.
 * Lives inside MapContainer so it can call `useMap()`.
 */
function MarkerCluster({
  places,
  locale,
  popupViewLabel,
  detailHrefPrefix,
  onSelect,
}: ClusterProps) {
  const map = useMap();

  useEffect(() => {
    const icon = makeDefaultIcon();
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });

    for (const place of places) {
      if (!place.geo) continue;
      const marker = L.marker([place.geo.lat, place.geo.lng], { icon });
      marker.on('click', () => onSelect(place));
      const title = placeTitle(place, locale);
      const region = place.region ? placeRegionName(place.region, locale) : null;
      marker.bindPopup(
        `<div class="leaflet-place-popup">
           <strong>${escapeHtml(title)}</strong>
           ${region ? `<div class="leaflet-place-popup__meta">${escapeHtml(region)}</div>` : ''}
           <a class="leaflet-place-popup__link" href="${detailHrefPrefix}/dia-diem/${encodeURIComponent(place.slug)}">${escapeHtml(popupViewLabel)}</a>
         </div>`,
      );
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
      cluster.clearLayers();
    };
  }, [map, places, locale, popupViewLabel, detailHrefPrefix, onSelect]);

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface FitBoundsProps {
  places: Place[];
  enabled: boolean;
}

function FitBounds({ places, enabled }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    const points = places
      .filter((p) => p.geo)
      .map((p) => [p.geo!.lat, p.geo!.lng] as [number, number]);
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      map.setView(first, 11);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, places, enabled]);

  return null;
}

/**
 * Interactive Leaflet map showing geo-located places with clustering and a
 * base layer switcher. Used by `/ban-do` and the search "map" view.
 */
export function PlacesMap({
  places,
  locale,
  center = GIA_LAI_CENTER,
  zoom = DEFAULT_ZOOM,
  fitToMarkers = true,
  height = '70vh',
}: PlacesMapProps) {
  const { theme } = useTheme();
  const t = useTranslations('map');
  const geoPlaces = useMemo(() => places.filter((p) => p.geo), [places]);
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    const items = new Map<string, string>();
    for (const place of geoPlaces) {
      for (const category of place.categories ?? []) {
        if (!items.has(category.slug))
          items.set(category.slug, placeCategoryName(category, locale));
      }
    }
    return [...items.entries()]
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [geoPlaces, locale]);

  const filteredGeoPlaces = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return geoPlaces.filter((place) => {
      const matchesCategory =
        categorySlug === 'all' ||
        (place.categories ?? []).some((item) => item.slug === categorySlug);
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const searchable = normalizeSearch(
        [
          placeTitle(place, locale),
          placeSummary(place, locale),
          place.region ? placeRegionName(place.region, locale) : '',
          ...(place.categories ?? []).map((item) => placeCategoryName(item, locale)),
        ]
          .filter(Boolean)
          .join(' '),
      );
      return searchable.includes(normalizedQuery);
    });
  }, [categorySlug, geoPlaces, locale, query]);

  useEffect(() => {
    if (selectedId && !filteredGeoPlaces.some((place) => place.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredGeoPlaces, selectedId]);

  const selected = filteredGeoPlaces.find((p) => p.id === selectedId) ?? null;
  const detailHrefPrefix = locale === 'en' ? '/en' : '';
  const popupViewLabel = t('popupViewDetails');
  const layerLabels = {
    standard: t('layer.standard'),
    satellite: t('layer.satellite'),
    terrain: t('layer.terrain'),
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-outline-variant ${
        theme === 'dark' ? 'leaflet-dark' : ''
      }`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: 'rgb(var(--color-surface-container))' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={layerLabels.standard}>
            <TileLayer
              url={TILE_LAYERS.standard.url}
              attribution={TILE_LAYERS.standard.attribution}
              maxZoom={TILE_LAYERS.standard.maxZoom}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={layerLabels.satellite}>
            <TileLayer
              url={TILE_LAYERS.satellite.url}
              attribution={TILE_LAYERS.satellite.attribution}
              maxZoom={TILE_LAYERS.satellite.maxZoom}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={layerLabels.terrain}>
            <TileLayer
              url={TILE_LAYERS.terrain.url}
              attribution={TILE_LAYERS.terrain.attribution}
              maxZoom={TILE_LAYERS.terrain.maxZoom}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MarkerCluster
          places={filteredGeoPlaces}
          locale={locale}
          popupViewLabel={popupViewLabel}
          detailHrefPrefix={detailHrefPrefix}
          onSelect={(p) => setSelectedId(p.id)}
        />
        <FitBounds places={filteredGeoPlaces} enabled={fitToMarkers} />

        {selected && selected.geo && (
          <Marker
            position={[selected.geo.lat, selected.geo.lng]}
            icon={makeDefaultIcon()}
            opacity={0}
            keyboard={false}
            interactive={false}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{placeTitle(selected, locale)}</strong>
                {selected.region && (
                  <div className="text-xs text-on-surface-variant">
                    {placeRegionName(selected.region, locale)}
                  </div>
                )}
                <a
                  className="text-primary hover:underline"
                  href={`${detailHrefPrefix}/dia-diem/${selected.slug}`}
                >
                  {popupViewLabel}
                </a>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {geoPlaces.length > 0 && (
        <div className="absolute left-3 right-3 top-3 z-[410] max-w-xl rounded-2xl border border-outline-variant/50 bg-surface/95 p-3 shadow-lg backdrop-blur md:left-4 md:right-auto md:min-w-[360px]">
          <label className="relative block">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 !text-base -translate-y-1/2 text-outline"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-body-sm text-on-surface outline-none transition focus:border-primary"
            />
          </label>
          {categories.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategorySlug('all')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  categorySlug === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setCategorySlug(category.slug)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    categorySlug === category.slug
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-on-surface-variant">
            {t('filteredCount', { shown: filteredGeoPlaces.length, total: geoPlaces.length })}
          </p>
        </div>
      )}

      {geoPlaces.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-lg bg-surface-container-lowest/90 px-4 py-3 text-body-sm text-on-surface-variant shadow-md backdrop-blur">
          {t('noGeoPlaces')}
        </div>
      )}
      {geoPlaces.length > 0 && filteredGeoPlaces.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[400] rounded-lg bg-surface-container-lowest/95 px-4 py-3 text-body-sm text-on-surface-variant shadow-md backdrop-blur md:inset-x-auto md:left-4">
          {t('noFilteredPlaces')}
        </div>
      )}
    </div>
  );
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim();
}
