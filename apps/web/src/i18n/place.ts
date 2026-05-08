import type { Place } from '@vivu/types';
import type { Locale } from './messages';

/**
 * Pick the localized title for a place. Falls back to Vietnamese if the
 * English copy is missing — mirrors how the editorial team currently
 * curates the catalog (Vietnamese first, English when available).
 */
export function placeTitle(place: Pick<Place, 'titleVi' | 'titleEn'>, locale: Locale): string {
  if (locale === 'en' && place.titleEn) return place.titleEn;
  return place.titleVi;
}

/** Same logic for short summaries. Returns `null` when neither side has copy. */
export function placeSummary(
  place: Pick<Place, 'summaryVi' | 'summaryEn'>,
  locale: Locale,
): string | null {
  if (locale === 'en' && place.summaryEn) return place.summaryEn;
  return place.summaryVi ?? place.summaryEn ?? null;
}

/** Same logic for the long-form description. */
export function placeDescription(
  place: Pick<Place, 'descriptionVi' | 'descriptionEn'>,
  locale: Locale,
): string | null {
  if (locale === 'en' && place.descriptionEn) return place.descriptionEn;
  return place.descriptionVi ?? place.descriptionEn ?? null;
}
