'use client';

import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useTranslations } from 'next-intl';
import type { Place } from '@vivu/types';
import { useTheme } from '../theme-provider';
import { placeRegionName, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';

interface PlacesMapProps {
  places: Place[];
  /** Active locale — controls popup labels and place text. */
  locale: Locale;
  /** Initial map centre (lat, lng). Defaults to mid-Vietnam. */
  center?: [number, number];
  /** Initial zoom. */
  zoom?: number;
  /** Auto-fit the map to the markers on first render. Default `true`. */
  fitToMarkers?: boolean;
  /** Render height — must be a fixed CSS dimension (Leaflet needs concrete size). */
  height?: string;
}

const VIETNAM_CENTER: [number, number] = [16.05, 107.54];
const DEFAULT_ZOOM = 6;

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
  center = VIETNAM_CENTER,
  zoom = DEFAULT_ZOOM,
  fitToMarkers = true,
  height = '70vh',
}: PlacesMapProps) {
  const { theme } = useTheme();
  const t = useTranslations('map');
  const geoPlaces = useMemo(() => places.filter((p) => p.geo), [places]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = geoPlaces.find((p) => p.id === selectedId) ?? null;
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
          places={geoPlaces}
          locale={locale}
          popupViewLabel={popupViewLabel}
          detailHrefPrefix={detailHrefPrefix}
          onSelect={(p) => setSelectedId(p.id)}
        />
        <FitBounds places={geoPlaces} enabled={fitToMarkers} />

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

      {geoPlaces.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-lg bg-surface-container-lowest/90 px-4 py-3 text-body-sm text-on-surface-variant shadow-md backdrop-blur">
          {t('noGeoPlaces')}
        </div>
      )}
    </div>
  );
}
