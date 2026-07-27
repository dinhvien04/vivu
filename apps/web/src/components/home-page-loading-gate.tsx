'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { PlaceCardSkeleton, Skeleton } from './skeleton';

interface HomePageLoadingGateProps {
  imageUrls: string[];
  children: ReactNode;
  maxWaitMs?: number;
}

export function HomePageLoadingGate({
  imageUrls,
  children,
  maxWaitMs = 3500,
}: HomePageLoadingGateProps) {
  const urls = useMemo(
    () =>
      Array.from(
        new Set(imageUrls.map((url) => url.trim()).filter((url): url is string => url.length > 0)),
      ),
    [imageUrls],
  );
  const [ready, setReady] = useState(urls.length === 0);

  useEffect(() => {
    let cancelled = false;
    setReady(urls.length === 0);
    if (urls.length === 0) return;

    Promise.race([Promise.all(urls.map(preloadImage)), delay(maxWaitMs)]).finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [maxWaitMs, urls]);

  if (!ready) return <HomePageSkeleton />;

  return <div>{children}</div>;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.decoding = 'async';
    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().then(resolve).catch(resolve);
        return;
      }
      resolve();
    };
    image.onerror = () => resolve();
    image.src = url;
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function HomePageSkeleton() {
  return (
    <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
      <section className="flex flex-col items-center gap-12 md:flex-row">
        <div className="w-full flex-1 space-y-6">
          <Skeleton className="h-14 w-5/6 max-w-xl" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-4/5 max-w-xl" />
          </div>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-12 w-52 rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full flex-1 rounded-xl" />
      </section>

      <section className="mt-section-gap rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <ol className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
              <Skeleton className="mb-4 h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="mt-3 h-5 w-4/5" />
            </li>
          ))}
        </ol>
      </section>

      <section className="py-section-gap">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto h-10 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-4 h-1 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8"
            >
              <Skeleton className="mb-6 h-14 w-14 rounded-full" />
              <Skeleton className="mb-4 h-7 w-3/4" />
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="mb-8 h-4 w-5/6" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-outline-variant/20 py-section-gap">
        <div className="mb-10 flex items-end justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-72 max-w-full" />
          </div>
          <Skeleton className="hidden h-5 w-24 sm:block" />
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PlaceCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
