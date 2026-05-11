'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { deleteReview, listReviewsForPlace } from '@/lib/reviews-client';
import type { Review } from '@vivu/types';

interface Props {
  placeSlug: string;
  initialReviews: Review[];
  initialTotal: number;
  /** Initial average from the place detail call (avoids extra fetch flicker). */
  initialAverage?: number;
}

function Stars({
  rating,
  size = 'sm',
  label,
}: {
  rating: number;
  size?: 'sm' | 'md';
  label: string;
}) {
  const cls = size === 'md' ? '!text-lg' : '!text-base';
  return (
    <span className="inline-flex items-center" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star_border'}
          className={`${cls} ${i <= rating ? 'text-secondary' : 'text-outline-variant'}`}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ReviewsSection({
  placeSlug,
  initialReviews,
  initialTotal,
  initialAverage = 0,
}: Props) {
  const t = useTranslations('reviewsSection');
  const locale = useLocale() as Locale;
  const { user, getAccessToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [average, setAverage] = useState(initialAverage);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      const r = await listReviewsForPlace(placeSlug, { pageSize: 20 });
      setReviews(r.data);
      setTotal(r.meta.total);
      const sum = r.data.reduce((acc, x) => acc + x.rating, 0);
      setAverage(r.data.length > 0 ? Math.round((sum / r.data.length) * 100) / 100 : 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('loadFailed'));
    }
  };

  // Refresh once on mount in case server data is stale (e.g. user just submitted)
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSlug]);

  const handleDelete = async (id: string): Promise<void> => {
    const ok = window.confirm(t('deleteConfirm'));
    if (!ok) return;
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('sessionExpired'));
      await deleteReview(id, token);
      setReviews((rs) => rs.filter((r) => r.id !== id));
      setTotal((n) => Math.max(0, n - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deleteFailed'));
    }
  };

  const writeHref = `/dia-diem/${placeSlug}/danh-gia/moi`;

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface">{t('title')}</h2>
          {total > 0 && (
            <p className="mt-1 flex items-center gap-2 text-body-md text-on-surface-variant">
              <Stars
                rating={Math.round(average)}
                size="md"
                label={t('starsAria', { rating: Math.round(average) })}
              />
              <span>
                <strong className="text-on-surface">{average.toFixed(1)}</strong>/5 ·{' '}
                <span>{t('totalSuffix', { total })}</span>
              </span>
            </p>
          )}
        </div>
        {user ? (
          <Link
            href={writeHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90"
          >
            <Icon name="rate_review" className="!text-base" />
            {t('writeBtn')}
          </Link>
        ) : (
          <Link
            href={`/dang-nhap?next=${encodeURIComponent(writeHref)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="login" className="!text-base" />
            {t('signInBtn')}
          </Link>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-sm text-on-error-container"
        >
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/40 p-8 text-center">
          <Icon name="rate_review" className="!text-3xl text-outline" />
          <h3 className="mt-2 font-h4 text-h4 text-on-surface">{t('emptyTitle')}</h3>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('emptyLead')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => {
            const isOwner = user?.id === r.user.id;
            return (
              <li
                key={r.id}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary">
                      {r.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.user.avatarUrl}
                          alt={r.user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold">{r.user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{r.user.name}</p>
                      <p className="text-body-sm text-outline">{formatDate(r.createdAt, locale)}</p>
                    </div>
                  </div>
                  <Stars rating={r.rating} label={t('starsAria', { rating: r.rating })} />
                </div>
                <p className="mt-3 whitespace-pre-line text-body-md leading-relaxed text-on-surface">
                  {r.content}
                </p>
                {isOwner && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-body-sm text-error hover:bg-error-container/40"
                    >
                      <Icon name="delete" className="!text-sm" />
                      {t('deleteBtn')}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
