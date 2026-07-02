import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-surface-container-low">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(215,227,255,0.7),rgba(248,249,250,0.96)_42%,rgba(218,228,238,0.72))] dark:bg-[linear-gradient(135deg,rgba(0,69,142,0.24),rgba(18,20,21,0.98)_46%,rgba(62,72,80,0.32))]"
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-margin-mobile py-8 md:px-margin-desktop md:py-12">
        {children}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-container-max px-margin-mobile pb-6 text-center text-on-surface-variant md:px-margin-desktop">
        <p className="font-label-caps opacity-60">
          {t('shellFooter', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}
