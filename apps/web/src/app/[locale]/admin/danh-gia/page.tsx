'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { adminHideReview, adminListReviews, adminRestoreReview } from '@/lib/reviews-client';
import type { Review, ReviewStatus } from '@vivu/types';

const TABS: {
  key: ReviewStatus;
  labelKey: 'reviewsTabReported' | 'reviewsTabVisible' | 'reviewsTabHidden';
}[] = [
  { key: 'reported', labelKey: 'reviewsTabReported' },
  { key: 'visible', labelKey: 'reviewsTabVisible' },
  { key: 'hidden', labelKey: 'reviewsTabHidden' },
];

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-secondary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name={i < value ? 'star' : 'star_border'} className="!text-base" />
      ))}
    </div>
  );
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminReviewsPage() {
  const t = useTranslations('admin');
  const locale = useLocale() as Locale;
  const { getAccessToken, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ReviewStatus>('reported');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Record<ReviewStatus, number>>({
    visible: 0,
    hidden: 0,
    reported: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const initials = useMemo(
    () => (name: string) =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((s) => s.charAt(0).toUpperCase())
        .join(''),
    [],
  );

  const fetchAll = async (focus: ReviewStatus): Promise<void> => {
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errSessionExpired'));
      const [main, vis, hid, rep] = await Promise.all([
        adminListReviews(token, { status: focus, pageSize: 50 }),
        adminListReviews(token, { status: 'visible', pageSize: 1 }),
        adminListReviews(token, { status: 'hidden', pageSize: 1 }),
        adminListReviews(token, { status: 'reported', pageSize: 1 }),
      ]);
      setReviews(main.data);
      setCounts({
        visible: vis.meta.total,
        hidden: hid.meta.total,
        reported: rep.meta.total,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errGeneric'));
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    void fetchAll(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, activeTab]);

  const action = async (id: string, op: 'hide' | 'restore'): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errSessionExpired'));
      if (op === 'hide') await adminHideReview(id, token);
      else await adminRestoreReview(id, token);
      await fetchAll(activeTab);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">
            {t('breadcrumb')}
          </p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">{t('reviewsTitle')}</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">{t('reviewsLead')}</p>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                active
                  ? 'rounded-full bg-primary px-4 py-1.5 text-body-sm font-semibold text-white'
                  : 'rounded-full bg-surface-container px-4 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container'
              }
            >
              {t(tab.labelKey)} ({counts[tab.key]})
            </button>
          );
        })}
      </nav>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 p-10 text-center">
          <Icon name="task_alt" className="!text-3xl text-outline" />
          <h3 className="mt-2 font-h4 text-h4 text-on-surface">
            {activeTab === 'reported'
              ? t('reviewsEmptyReported')
              : activeTab === 'hidden'
                ? t('reviewsEmptyHidden')
                : t('reviewsEmptyVisible')}
          </h3>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('reviewsEmptyHint')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm"
            >
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
                    {r.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.user.avatarUrl}
                        alt={r.user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      initials(r.user.name)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{r.user.name}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {t('reviewLabel')}{' '}
                      {r.place ? (
                        <Link
                          href={`/dia-diem/${r.place.slug}`}
                          target="_blank"
                          className="font-semibold text-primary hover:underline"
                        >
                          {placeTitle(r.place, locale)}
                        </Link>
                      ) : (
                        <span className="font-semibold text-primary">{t('placePlaceholder')}</span>
                      )}{' '}
                      · {formatDate(r.createdAt, locale)}
                    </p>
                  </div>
                </div>
                <StarRow value={r.rating} />
              </div>
              <p className="mt-4 whitespace-pre-line text-body-md leading-relaxed text-on-surface">
                {r.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {r.status !== 'hidden' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => action(r.id, 'hide')}
                    className="inline-flex items-center gap-1 rounded-lg border border-error/40 px-3 py-2 text-body-sm font-medium text-error hover:bg-error-container/30 disabled:opacity-60"
                  >
                    <Icon name="visibility_off" className="!text-base" />
                    {t('hideAction')}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => action(r.id, 'restore')}
                    className="inline-flex items-center gap-1 rounded-lg bg-tertiary px-3 py-2 text-body-sm font-semibold text-on-tertiary hover:bg-tertiary/90 disabled:opacity-60"
                  >
                    <Icon name="visibility" className="!text-base" />
                    {t('restoreAction')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
