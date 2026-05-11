import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminLiveStats } from '@/components/admin/admin-live-stats';
import { AdminQuickActions } from '@/components/admin/admin-quick-actions';
import { AdminRecentActivity } from '@/components/admin/admin-recent-activity';
import { AdminSystemHealth } from '@/components/admin/admin-system-health';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { listPlaces } from '@/lib/api';
import { placeRegionName, placeTitle } from '@/i18n/place';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<{ title: string }> {
  const t = await getTranslations({ locale: params.locale, namespace: 'admin' });
  return { title: t('title') };
}

const REGIONS = [
  { slug: 'mien-bac', labelKey: 'regionMienBac', icon: 'north' },
  { slug: 'mien-trung', labelKey: 'regionMienTrung', icon: 'east' },
  { slug: 'tay-nguyen', labelKey: 'regionTayNguyen', icon: 'landscape' },
  { slug: 'mien-nam', labelKey: 'regionMienNam', icon: 'south' },
] as const;

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, hint, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon name={icon} />
        </div>
      </div>
      <p className="text-overline uppercase tracking-overline text-on-surface-variant">{label}</p>
      <p className="mt-1 font-h2 text-h2 text-on-surface">{value}</p>
      {hint && <p className="mt-2 text-body-sm text-outline">{hint}</p>}
    </div>
  );
}

interface AdminDashboardProps {
  params: { locale: Locale };
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');
  // Pull a quick aggregate by hitting the list endpoint with pageSize=1 for
  // each region. Total count is returned in `meta.total`.
  let totalPlaces = 0;
  let recentPlaces: Awaited<ReturnType<typeof listPlaces>>['data'] = [];
  const byRegion: Record<string, number> = {};

  try {
    const all = await listPlaces({ pageSize: 6 });
    totalPlaces = all.meta.total;
    recentPlaces = all.data;

    await Promise.all(
      REGIONS.map(async (r) => {
        const res = await listPlaces({ region: r.slug, pageSize: 1 });
        byRegion[r.slug] = res.meta.total;
      }),
    );
  } catch {
    // Surface as zero — admin page still renders.
  }

  return (
    <>
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">
            {t('breadcrumb')}
          </p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">{t('title')}</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">{t('lead')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dia-diem"
            className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-container/40"
          >
            <Icon name="list_alt" className="text-base" />
            {t('managePlaces')}
          </Link>
          <Link
            href="/admin/dia-diem/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
          >
            <Icon name="add" className="text-base" />
            {t('newPlace')}
          </Link>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label={t('statTotalPlaces')}
          value={totalPlaces}
          hint={t('statTotalPlacesHint')}
          icon="place"
          iconBg="bg-secondary-container"
          iconColor="text-primary"
        />
        <AdminLiveStats />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-h4 text-h4 text-on-surface">{t('regionDistribution')}</h2>
          <ul className="space-y-3">
            {REGIONS.map((r) => {
              const count = byRegion[r.slug] ?? 0;
              const pct = totalPlaces > 0 ? Math.round((count / totalPlaces) * 100) : 0;
              return (
                <li key={r.slug}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-body-md text-on-surface">
                      <Icon name={r.icon} className="text-base text-primary" />
                      {t(r.labelKey)}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-h4 text-h4 text-on-surface">{t('recentPlaces')}</h2>
            <Link
              href="/admin/dia-diem"
              className="text-body-sm font-semibold text-primary hover:underline"
            >
              {t('viewAll')}
            </Link>
          </div>
          <ul className="divide-y divide-outline-variant/30">
            {recentPlaces.length === 0 ? (
              <li className="py-4 text-center text-body-sm text-on-surface-variant">
                {t('noData')}
              </li>
            ) : (
              recentPlaces.map((p) => {
                const title = placeTitle(p, params.locale);
                return (
                  <li key={p.id} className="flex items-center gap-4 py-3">
                    <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {p.heroImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.heroImageUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/dia-diem/${p.slug}`}
                        className="block truncate font-semibold text-on-surface hover:text-primary"
                      >
                        {title}
                      </Link>
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {p.region ? placeRegionName(p.region, params.locale) : '—'} ·{' '}
                        {p.address ?? t('noAddress')}
                      </p>
                    </div>
                    <span className="hidden flex-shrink-0 rounded-full bg-secondary-container px-3 py-1 text-body-sm text-on-secondary-container md:inline">
                      {p.status}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminRecentActivity />
        <AdminSystemHealth />
        <AdminQuickActions />
      </section>
    </>
  );
}
