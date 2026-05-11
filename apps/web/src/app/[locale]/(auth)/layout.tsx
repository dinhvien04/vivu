import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-surface-container-low">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-primary-fixed via-surface-container-low to-tertiary-fixed opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.7),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(255,255,255,0.5),transparent_45%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-container-max items-center justify-between px-margin-mobile py-6 md:px-margin-desktop">
        <Link
          href="/"
          aria-label={t('shellHomeAria')}
          className="font-h2 text-h2 font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          Vivu
        </Link>
        <Link
          href="/"
          className="text-body-md font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          {t('shellHomeBack')}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-margin-mobile pb-12 pt-4 md:px-margin-desktop">
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
