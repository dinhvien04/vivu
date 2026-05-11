'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { getAdminStats, type AdminStats } from '@/lib/admin-stats-client';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

function StatCard({ label, value, hint, icon, iconBg, iconColor, loading }: StatCardProps) {
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
      {loading ? (
        <span
          className="mt-1 inline-block h-8 w-16 animate-pulse rounded bg-surface-container"
          aria-hidden="true"
        />
      ) : (
        <p className="mt-1 font-h2 text-h2 text-on-surface">{value}</p>
      )}
      {hint && <p className="mt-2 text-body-sm text-outline">{hint}</p>}
    </div>
  );
}

/**
 * Live-fetched admin stats. Renders the "Đánh giá" + "Người dùng tích cực"
 * cards with values from `GET /admin/stats` (requires admin/editor bearer).
 */
export function AdminLiveStats() {
  const t = useTranslations('admin');
  const { getAccessToken, user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const data = await getAdminStats(token);
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, user]);

  const loading = !stats && !error;
  const reviewsValue = error ? '—' : (stats?.totalReviews ?? 0);
  const activeValue = error ? '—' : (stats?.activeUsers ?? 0);

  return (
    <>
      <StatCard
        label={t('statTotalReviews')}
        value={reviewsValue}
        hint={t('statTotalReviewsHint')}
        icon="reviews"
        iconBg="bg-tertiary-container/40"
        iconColor="text-tertiary"
        loading={loading}
      />
      <StatCard
        label={t('statActiveUsers')}
        value={activeValue}
        hint={t('statActiveUsersHint')}
        icon="group"
        iconBg="bg-primary-container/40"
        iconColor="text-primary"
        loading={loading}
      />
    </>
  );
}
