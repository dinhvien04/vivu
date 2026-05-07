/**
 * Tiện ích biểu diễn mùa của địa điểm.
 * Schema lưu mảng các slug `spring`, `summer`, `autumn`, `winter`.
 */

const SEASON_LABELS: Record<string, { label: string; months: string }> = {
  spring: { label: 'Mùa xuân', months: 'Tháng 2 – Tháng 4' },
  summer: { label: 'Mùa hè', months: 'Tháng 5 – Tháng 8' },
  autumn: { label: 'Mùa thu', months: 'Tháng 9 – Tháng 11' },
  winter: { label: 'Mùa đông', months: 'Tháng 12 – Tháng 1' },
};

export function getSeasonLabel(slug: string): string {
  return SEASON_LABELS[slug]?.label ?? slug;
}

export function formatBestSeasons(slugs: string[]): string {
  if (!slugs.length) return 'Đi được quanh năm';
  return slugs.map((s) => SEASON_LABELS[s]?.label ?? s).join(' · ');
}

export function formatSeasonMonths(slugs: string[]): string {
  if (!slugs.length) return 'Quanh năm';
  return slugs.map((s) => SEASON_LABELS[s]?.months ?? s).join(' · ');
}
