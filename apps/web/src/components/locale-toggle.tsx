'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const SHORT_LABEL: Record<Locale, string> = {
  vi: 'VI',
  en: 'EN',
};

const LONG_LABEL: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

interface LocaleToggleProps {
  className?: string;
}

/**
 * Tiny pill-shaped switcher that flips between Vietnamese and English by
 * rewriting the URL via next-intl navigation, so the locale prefix is
 * added/removed automatically (`/kham-pha` ↔ `/en/kham-pha`).
 */
export function LocaleToggle({ className }: LocaleToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [pending, startTransition] = useTransition();

  const next: Locale = locale === 'vi' ? 'en' : 'vi';

  const onClick = () => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <button
      type="button"
      aria-label={`${t('common.toggleLocale')} (${LONG_LABEL[next]})`}
      title={`${t('common.toggleLocale')} → ${LONG_LABEL[next]}`}
      onClick={onClick}
      disabled={pending}
      className={
        className ??
        'rounded-full border border-outline-variant px-2.5 py-1 font-label-caps text-on-surface transition-colors hover:bg-surface-container disabled:opacity-60'
      }
    >
      {SHORT_LABEL[locale]}
    </button>
  );
}
