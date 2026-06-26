'use client';

import { useLocale, useTranslations } from 'next-intl';
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

export function AdminLiveStats() {
  const t = useTranslations('admin');
  const locale = useLocale();
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
  const empty = error ? '-' : 0;
  const vi = locale !== 'en';
  const topLeadPlace = stats?.topLeadPlaces?.[0];
  const topViewedPlace = stats?.topPlacesViewed?.[0];

  return (
    <>
      <StatCard
        label={t('statTotalReviews')}
        value={error ? empty : (stats?.totalReviews ?? 0)}
        hint={t('statTotalReviewsHint')}
        icon="reviews"
        iconBg="bg-tertiary-container/40"
        iconColor="text-tertiary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'Lead tư vấn' : 'Leads'}
        value={error ? empty : (stats?.totalLeads ?? 0)}
        hint={vi ? 'Yêu cầu tư vấn đã ghi nhận' : 'Captured consultation requests'}
        icon="support_agent"
        iconBg="bg-primary-container/40"
        iconColor="text-primary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'Lead mới' : 'New leads'}
        value={error ? empty : (stats?.newLeads ?? 0)}
        hint={vi ? 'Cần liên hệ hôm nay' : 'Need follow-up today'}
        icon="mark_email_unread"
        iconBg="bg-error-container/40"
        iconColor="text-error"
        loading={loading}
      />
      <StatCard
        label={vi ? 'Đang tư vấn' : 'Planning leads'}
        value={error ? empty : (stats?.planningLeads ?? 0)}
        hint={
          topLeadPlace
            ? vi
              ? `Địa danh tạo lead nhiều: ${topLeadPlace.placeSlug}`
              : `Top lead place: ${topLeadPlace.placeSlug}`
            : vi
              ? 'Chưa có địa danh nổi bật'
              : 'No top lead place yet'
        }
        icon="forum"
        iconBg="bg-primary-container/40"
        iconColor="text-primary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'Báo lỗi mới' : 'New reports'}
        value={error ? empty : (stats?.newDataReports ?? 0)}
        hint={
          vi
            ? `${stats?.resolvedDataReports7d ?? 0} đã xử lý trong 7 ngày`
            : `${stats?.resolvedDataReports7d ?? 0} resolved in 7 days`
        }
        icon="report"
        iconBg="bg-tertiary-container/40"
        iconColor="text-tertiary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'AI cần xem lại' : 'AI review needed'}
        value={error ? empty : (stats?.aiFeedbackIssues ?? 0) + (stats?.missingContextEvents ?? 0)}
        hint={
          vi
            ? `${stats?.missingContextEvents ?? 0} lần thiếu dữ liệu`
            : `${stats?.missingContextEvents ?? 0} missing-context events`
        }
        icon="psychology_alt"
        iconBg="bg-secondary-container/60"
        iconColor="text-secondary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'Lịch trình AI' : 'AI trip plans'}
        value={error ? empty : (stats?.totalTripPlans ?? 0)}
        hint={
          vi ? `${stats?.tripPlansToday ?? 0} tạo hôm nay` : `${stats?.tripPlansToday ?? 0} today`
        }
        icon="route"
        iconBg="bg-secondary-container/60"
        iconColor="text-secondary"
        loading={loading}
      />
      <StatCard
        label={vi ? 'AI hôm nay' : 'AI today'}
        value={error ? empty : (stats?.aiRequestsToday ?? 0)}
        hint={vi ? 'Lượt dùng AI chat trong ngày' : 'AI chat requests today'}
        icon="auto_awesome"
        iconBg="bg-tertiary-container/40"
        iconColor="text-tertiary"
        loading={loading}
      />
      <StatCard
        label={t('statActiveUsers')}
        value={error ? empty : (stats?.activeUsers ?? 0)}
        hint={
          topViewedPlace
            ? vi
              ? `Địa danh được xem nhiều: ${topViewedPlace.placeSlug}`
              : `Top viewed: ${topViewedPlace.placeSlug}`
            : t('statActiveUsersHint')
        }
        icon="group"
        iconBg="bg-primary-container/40"
        iconColor="text-primary"
        loading={loading}
      />
    </>
  );
}
