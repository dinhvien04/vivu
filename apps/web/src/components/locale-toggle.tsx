'use client';

import { useLocale } from './locale-provider';
import { LOCALE_SHORT_LABEL, LOCALE_LABEL } from '../i18n/messages';

interface LocaleToggleProps {
  className?: string;
}

/**
 * Tiny pill-shaped switcher that flips between Vietnamese and English.
 * The current short label (`VI` / `EN`) is shown so the user can see which
 * locale will be active *after* clicking — matching how dark-mode toggles
 * usually behave.
 */
export function LocaleToggle({ className }: LocaleToggleProps) {
  const { locale, cycle, t } = useLocale();
  const next = locale === 'vi' ? 'en' : 'vi';
  return (
    <button
      type="button"
      aria-label={`${t('common.toggleLocale')} (${LOCALE_LABEL[next]})`}
      title={`${t('common.toggleLocale')} → ${LOCALE_LABEL[next]}`}
      onClick={cycle}
      className={
        className ??
        'rounded-full border border-outline-variant px-2.5 py-1 font-label-caps text-on-surface transition-colors hover:bg-surface-container'
      }
    >
      {LOCALE_SHORT_LABEL[locale]}
    </button>
  );
}
