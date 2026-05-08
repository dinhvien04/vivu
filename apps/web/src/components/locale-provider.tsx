'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LOCALES, MESSAGES, format, type Locale, type MessageKey } from '../i18n/messages';

interface LocaleContextValue {
  locale: Locale;
  setLocale(next: Locale): void;
  /** Cycle through available locales — handy for compact toggle buttons. */
  cycle(): void;
  /** Translation helper. Pass `params` for `{token}` substitution. */
  t(key: MessageKey, params?: Record<string, string | number>): string;
}

const STORAGE_KEY = 'vivu.locale';
const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'vi';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  // Fallback: peek at the browser language; everything non-Vietnamese maps to English.
  const browser = window.navigator.language?.toLowerCase() ?? '';
  if (browser.startsWith('vi')) return 'vi';
  if (browser.startsWith('en')) return 'en';
  return 'vi';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // We default to Vietnamese during SSR — the provider re-syncs on mount and
  // updates `<html lang>` so screen readers see the right locale.
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    const next = readStoredLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  const cycle = useCallback(() => {
    setLocale(locale === 'vi' ? 'en' : 'vi');
  }, [locale, setLocale]);

  const t = useCallback<LocaleContextValue['t']>(
    (key, params) => format(MESSAGES[locale][key], params),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, cycle, t }),
    [locale, setLocale, cycle, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

/** Convenience hook returning just the `t` function. */
export function useTranslations(): LocaleContextValue['t'] {
  return useLocale().t;
}
