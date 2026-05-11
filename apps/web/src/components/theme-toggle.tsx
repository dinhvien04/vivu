'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Icon } from './icon';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  /** Compact icon-only variant for headers. Default `true`. */
  iconOnly?: boolean;
}

export function ThemeToggle({ iconOnly = true }: ThemeToggleProps) {
  const t = useTranslations('common.toggleTheme');
  const { theme, toggle } = useTheme();
  // Avoid SSR hydration mismatch — the icon depends on the resolved theme.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const label = isDark ? t('toLight') : t('toDark');

  if (iconOnly) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggle}
        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
      >
        <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container"
    >
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="!text-base" />
      <span>{isDark ? t('light') : t('dark')}</span>
    </button>
  );
}
