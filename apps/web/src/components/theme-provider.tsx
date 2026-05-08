'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

interface ThemeContextValue {
  /** User preference: 'light' | 'dark' | 'system'. Persisted in localStorage. */
  preference: ThemePreference;
  /** Resolved theme actually applied to <html> ('light' | 'dark'). */
  theme: Theme;
  /** Persist a new preference and apply it. */
  setPreference(next: ThemePreference): void;
  /** Convenience: flip between light and dark, ignoring 'system'. */
  toggle(): void;
}

const STORAGE_KEY = 'vivu.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function resolveTheme(pref: ThemePreference): Theme {
  if (pref === 'light' || pref === 'dark') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyDomTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR: default to 'system' / 'light'. The preflight script in <head> already
  // applied the correct class before hydration so we just keep state in sync.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<Theme>('light');

  // First mount: read persisted preference and resolve theme.
  useEffect(() => {
    const pref = readStoredPreference();
    setPreferenceState(pref);
    const resolved = resolveTheme(pref);
    setTheme(resolved);
    applyDomTheme(resolved);
  }, []);

  // Follow system theme changes when user picked 'system'.
  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const resolved: Theme = mq.matches ? 'dark' : 'light';
      setTheme(resolved);
      applyDomTheme(resolved);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (typeof window !== 'undefined') {
      if (next === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    }
    const resolved = resolveTheme(next);
    setTheme(resolved);
    applyDomTheme(resolved);
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

/**
 * Inline script run in <head> before hydration to prevent a flash of
 * incorrect theme on first paint. Reads the same key the provider writes.
 */
export const THEME_PREFLIGHT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    root.style.colorScheme = theme;
  } catch (e) { /* ignore */ }
})();
`.trim();
