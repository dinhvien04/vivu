'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { listQuestions } from '@/lib/qa-client';
import type { Paginated, Question } from '@vivu/types';

function useFormatRelative() {
  const t = useTranslations('qaSection');
  const locale = useLocale() as Locale;
  return (iso: string): string => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return t('justNow');
    if (min < 60) return t('minutesAgo', { count: min });
    const h = Math.floor(min / 60);
    if (h < 24) return t('hoursAgo', { count: h });
    const day = Math.floor(h / 24);
    if (day < 30) return t('daysAgo', { count: day });
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
}

export default function HoiDapListPage() {
  const t = useTranslations('qa');
  const locale = useLocale() as Locale;
  const formatRelative = useFormatRelative();
  const [page, setPage] = useState<Paginated<Question> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listQuestions({ pageSize: 30 });
        if (!cancelled) setPage(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('errorGeneric'));
          setPage({ data: [], meta: { page: 1, pageSize: 30, total: 0 } });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-overline uppercase tracking-overline text-secondary">
              {t('listOverline')}
            </p>
            <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('listTitle')}</h1>
            <p className="mt-3 font-sans text-body-lg text-on-surface-variant">{t('listLead')}</p>
          </div>
          <Link
            href="/kham-pha"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Icon name="explore" className="!text-base" />
            {t('findPlaces')}
          </Link>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        {page === null ? (
          <ul className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-surface-container"
                aria-hidden
              />
            ))}
          </ul>
        ) : page.data.length === 0 ? (
          <EmptyState
            icon="forum"
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={{ label: t('explorePlaces'), href: '/kham-pha' }}
          />
        ) : (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              {t('totalQuestions', { total: page.meta.total })}
            </p>
            <ul className="space-y-4">
              {page.data.map((q) => (
                <li
                  key={q.id}
                  className="rounded-2xl border border-outline-variant bg-surface px-5 py-5 transition-all hover:border-primary/40 hover:shadow-premium"
                >
                  <Link href={`/hoi-dap/${q.id}`} className="block">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                      {q.place && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
                          <Icon name="place" className="!text-sm" />
                          {placeTitle(q.place, locale)}
                        </span>
                      )}
                      <span>•</span>
                      <span>{q.user.name}</span>
                      <span>•</span>
                      <span>{formatRelative(q.createdAt)}</span>
                    </div>
                    <p className="font-h3 text-h3 text-on-surface line-clamp-3 group-hover:text-primary">
                      {q.content}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-label-md text-secondary">
                      <Icon name="comment" className="!text-base" />
                      {t('answersCount', { count: q.answersCount })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
