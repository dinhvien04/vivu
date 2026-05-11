/**
 * Locale-aware helpers for rendering a place's `bestSeasons` array.
 * The schema stores slugs `spring`, `summer`, `autumn`, `winter`.
 */

import type { Locale } from '@/i18n/routing';

const SEASON_LABELS: Record<string, Record<Locale, { label: string; months: string }>> = {
  spring: {
    vi: { label: 'Mùa xuân', months: 'Tháng 2 – Tháng 4' },
    en: { label: 'Spring', months: 'Feb – Apr' },
  },
  summer: {
    vi: { label: 'Mùa hè', months: 'Tháng 5 – Tháng 8' },
    en: { label: 'Summer', months: 'May – Aug' },
  },
  autumn: {
    vi: { label: 'Mùa thu', months: 'Tháng 9 – Tháng 11' },
    en: { label: 'Autumn', months: 'Sep – Nov' },
  },
  winter: {
    vi: { label: 'Mùa đông', months: 'Tháng 12 – Tháng 1' },
    en: { label: 'Winter', months: 'Dec – Jan' },
  },
};

const ANY_TIME: Record<Locale, { label: string; months: string }> = {
  vi: { label: 'Đi được quanh năm', months: 'Quanh năm' },
  en: { label: 'Year-round', months: 'Year-round' },
};

export function getSeasonLabel(slug: string, locale: Locale = 'vi'): string {
  return SEASON_LABELS[slug]?.[locale]?.label ?? slug;
}

export function formatBestSeasons(slugs: string[], locale: Locale = 'vi'): string {
  if (!slugs.length) return ANY_TIME[locale].label;
  return slugs.map((s) => SEASON_LABELS[s]?.[locale]?.label ?? s).join(' · ');
}

export function formatSeasonMonths(slugs: string[], locale: Locale = 'vi'): string {
  if (!slugs.length) return ANY_TIME[locale].months;
  return slugs.map((s) => SEASON_LABELS[s]?.[locale]?.months ?? s).join(' · ');
}
