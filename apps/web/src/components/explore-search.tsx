'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Icon } from './icon';

interface ExploreSearchProps {
  initialQuery?: string;
  locale: Locale;
}

const DEBOUNCE_MS = 400;

export function ExploreSearch({ initialQuery = '', locale }: ExploreSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const lastCommittedRef = useRef(initialQuery.trim());
  const labels =
    locale === 'en'
      ? {
          search: 'Search Gia Lai places',
          placeholder: 'Search by place name...',
          clear: 'Clear search',
        }
      : {
          search: 'Tìm địa danh Gia Lai',
          placeholder: 'Tìm theo tên địa danh...',
          clear: 'Xóa tìm kiếm',
        };

  useEffect(() => {
    setQuery(initialQuery);
    lastCommittedRef.current = initialQuery.trim();
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === lastCommittedRef.current) return;

    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
      const qs = params.toString();
      lastCommittedRef.current = trimmed;
      router.replace(qs ? `/kham-pha?${qs}` : '/kham-pha');
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query, router, searchParams]);

  return (
    <div className="mb-6 max-w-xl">
      <label htmlFor="explore-search" className="sr-only">
        {labels.search}
      </label>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 !text-base -translate-y-1/2 text-outline"
        />
        <input
          id="explore-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.placeholder}
          className="h-12 w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-11 pr-12 text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant/80 focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        {query && (
          <button
            type="button"
            aria-label={labels.clear}
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          >
            <Icon name="close" className="!text-base" />
          </button>
        )}
      </div>
    </div>
  );
}
