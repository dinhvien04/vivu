'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { Place } from '@/lib/api';
import { listMyFavorites } from '@/lib/favorites-client';

export default function YeuThichPage() {
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
          setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          setPlaces([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 max-w-3xl">
          <p className="text-overline uppercase tracking-overline text-secondary">Tài khoản</p>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">Địa điểm yêu thích</h1>
          <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
            Những nơi bạn đã lưu để ghé thăm sau này.
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
            title="Chưa có địa điểm yêu thích"
            description="Khám phá các điểm đến và bấm 'Thêm vào sổ tay' để lưu lại tại đây."
            action={{ label: 'Khám phá ngay', href: '/kham-pha' }}
          />
        ) : (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">{places.length} địa điểm</p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <li key={place.id}>
                  <PlaceCard place={place} />
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
