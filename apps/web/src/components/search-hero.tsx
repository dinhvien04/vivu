'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { getSuggest, type SuggestPlace } from '@/lib/search-client';
import { Icon } from './icon';

interface Props {
  initialQuery?: string;
  /** When true, renders compact single-line input (used in header). */
  compact?: boolean;
  placeholder?: string;
}

function placeTitle(p: SuggestPlace): string {
  return p.titleVi || p.titleEn || p.slug;
}

export function SearchHero({ initialQuery = '', compact = false, placeholder }: Props) {
  const t = useTranslations('common');
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SuggestPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLFormElement | null>(null);

  // Debounced fetch — only in compact mode (header), so the hero on / and
  // /tim-kiem keep their simple full-form submit behavior.
  useEffect(() => {
    if (!compact) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getSuggest(trimmed, { limit: 6, signal: controller.signal });
        if (cancelled) return;
        setSuggestions(data);
        setOpen(true);
        setActive(-1);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [q, compact]);

  // Click outside closes dropdown.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = q.trim();
    setOpen(false);
    router.push(trimmed ? `/tim-kiem?q=${encodeURIComponent(trimmed)}` : '/tim-kiem');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!compact || !open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const p = suggestions[active];
      if (!p) return;
      setOpen(false);
      router.push(`/dia-diem/${p.slug}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <form
      ref={containerRef}
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
        onFocus={() => {
          if (compact && suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role={compact ? 'combobox' : undefined}
        aria-autocomplete={compact ? 'list' : undefined}
        aria-expanded={compact ? open : undefined}
        aria-controls={compact ? 'header-search-listbox' : undefined}
        placeholder={placeholder ?? t('searchPlaceholder')}
        className={
          compact
            ? 'w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
            : 'flex-1 bg-transparent px-4 py-3 text-body-lg text-on-surface focus:outline-none'
        }
      />
      {!compact && (
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Icon name="search" className="!text-base" />
          {t('searchSubmit')}
        </button>
      )}

      {compact && open && (
        <div
          id="header-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-outline-variant bg-surface shadow-lg"
        >
          {loading && (
            <div className="px-4 py-3 text-body-sm text-on-surface-variant">
              {t('searchLoading')}
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-body-sm text-on-surface-variant">{t('searchEmpty')}</div>
          )}
          {!loading && suggestions.length > 0 && (
            <>
              <ul className="divide-y divide-outline-variant/30">
                {suggestions.map((p, i) => {
                  const isActive = i === active;
                  return (
                    <li key={p.id} role="option" aria-selected={isActive}>
                      <Link
                        href={`/dia-diem/${p.slug}`}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActive(i)}
                        className={
                          isActive
                            ? 'flex items-center gap-3 bg-secondary-container/50 px-4 py-2'
                            : 'flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-container'
                        }
                      >
                        <Icon name="place" className="!text-base text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-on-surface">{placeTitle(p)}</p>
                          {p.address && (
                            <p className="truncate text-body-sm text-on-surface-variant">
                              {p.address}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/tim-kiem?q=${encodeURIComponent(q.trim())}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 border-t border-outline-variant/30 px-4 py-3 text-body-sm font-semibold text-primary transition-colors hover:bg-surface-container"
              >
                <Icon name="search" className="!text-base" />
                {t('searchSeeAll')}
              </Link>
            </>
          )}
        </div>
      )}
    </form>
  );
}
