'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Place } from '@/lib/api';
import { listMyFavorites } from '@/lib/favorites-client';

export default function YeuThichPage() {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/dang-nhap?next=/tai-khoan/yeu-thich');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          router.replace('/dang-nhap?next=/tai-khoan/yeu-thich');
          return;
        }
        const data = await listMyFavorites(token);
        if (!cancelled) setPlaces(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('favoritesLoadFailed'));
          setPlaces([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken, t]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 max-w-3xl">
          <p className="text-overline uppercase tracking-overline text-secondary">
            {tCommon('account')}
          </p>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('favoritesTitle')}</h1>
          <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
            {t('favoritesLead')}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        {places === null ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-72 animate-pulse rounded-xl bg-surface-container"
                aria-hidden
              />
            ))}
          </ul>
        ) : places.length === 0 ? (
          <EmptyState
            icon="favorite_border"
            title={t('favoritesEmpty')}
            description={t('favoritesEmptyHint')}
            action={{ label: t('favoritesEmptyAction'), href: '/kham-pha' }}
          />
        ) : (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              {t('placeCount', { count: places.length })}
            </p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} locale={locale} />
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
