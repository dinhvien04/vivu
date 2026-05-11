'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { adminListReviews } from '@/lib/reviews-client';
import type { Review } from '@vivu/types';

function statusIcon(status: Review['status']): { icon: string; tone: string } {
  if (status === 'visible') return { icon: 'check_circle', tone: 'text-emerald-600' };
  if (status === 'hidden') return { icon: 'visibility_off', tone: 'text-slate-500' };
  return { icon: 'flag', tone: 'text-amber-600' };
}

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return iso;
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < minute) return locale === 'en' ? 'just now' : 'vừa xong';
  if (diff < hour) {
    const m = Math.round(diff / minute);
    return locale === 'en' ? `${m}m ago` : `${m} phút trước`;
  }
  if (diff < day) {
    const h = Math.round(diff / hour);
    return locale === 'en' ? `${h}h ago` : `${h} giờ trước`;
  }
  const d = Math.round(diff / day);
  return locale === 'en' ? `${d}d ago` : `${d} ngày trước`;
}

export function AdminRecentActivity() {
  const t = useTranslations('admin');
  const { getAccessToken, user } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await adminListReviews(token, { pageSize: 6 });
        if (!cancelled) setReviews(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, user]);

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'vi' : 'vi';

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-h4 text-h4 text-on-surface">{t('recentActivity')}</h2>
        <Icon name="bolt" className="text-primary" />
      </div>

      {reviews === null && !error && (
        <ul className="space-y-3" aria-busy="true">
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
        </ul>
      )}

      {error && <p className="text-body-sm text-on-surface-variant">{t('recentActivityError')}</p>}

      {reviews && reviews.length === 0 && (
        <p className="text-body-sm text-on-surface-variant">{t('noData')}</p>
      )}

      {reviews && reviews.length > 0 && (
        <ul className="divide-y divide-outline-variant/30">
          {reviews.map((r) => {
            const m = statusIcon(r.status);
            return (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <Icon name={m.icon} className={`!text-xl ${m.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-semibold text-on-surface">
                    {t('activityReview', { rating: r.rating })}
                  </p>
                  <p className="line-clamp-1 text-body-sm text-on-surface-variant">{r.content}</p>
                </div>
                <span className="flex-shrink-0 text-overline tracking-overline text-outline">
                  {timeAgo(r.createdAt, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
