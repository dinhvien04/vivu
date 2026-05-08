'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './icon';

interface Props {
  initialQuery?: string;
  /** When true, renders compact single-line input (used in header). */
  compact?: boolean;
  placeholder?: string;
}

export function SearchHero({ initialQuery = '', compact = false, placeholder }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/tim-kiem?q=${encodeURIComponent(trimmed)}` : '/tim-kiem');
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={
        compact
          ? 'relative w-full'
          : 'relative flex w-full items-center rounded-full border border-outline-variant bg-surface px-1 py-1 shadow-sm focus-within:border-primary focus-within:shadow-md'
      }
    >
      <Icon
        name="search"
        className={
          compact
            ? 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-base text-outline'
            : 'ml-4 !text-2xl text-outline'
        }
      />
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? 'Tìm địa điểm, vùng miền, chủ đề…'}
        className={
          compact
            ? 'w-full rounded-full border border-outline-variant bg-white py-2 pl-10 pr-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
            : 'flex-1 bg-transparent px-4 py-3 text-body-lg text-on-surface focus:outline-none'
        }
      />
      {!compact && (
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Icon name="search" className="!text-base" />
          Tìm
        </button>
      )}
    </form>
  );
}
