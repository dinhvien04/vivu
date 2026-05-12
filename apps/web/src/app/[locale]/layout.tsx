import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider, THEME_PREFLIGHT_SCRIPT } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site-url';
import '../globals.css';

// Fonts (Inter + Be Vietnam Pro) are self-hosted via `src/app/fonts.css`, which
// is imported from `globals.css`. We previously used `next/font/google`, but
// that triggers a build-time fetch to fonts.gstatic.com and fails on networks
// that block Google (CI runners behind certain firewalls, dev machines in
// regions where Google services are slow/unreachable).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  // Vietnamese (default locale) is served from `/`; English from `/en`.
  const path = locale === routing.defaultLocale ? '/' : `/${locale}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('title'),
      template: '%s · Vivu',
    },
    description: t('description'),
    alternates: {
      canonical: path,
      languages: {
        vi: '/',
        en: '/en',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Vivu',
      locale: t('ogLocale'),
      url: path,
      title: t('title'),
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Material Symbols Outlined — used for inline icons matching the design system. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Apply the theme class before hydration to prevent a light-mode flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PREFLIGHT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <AuthProvider>{children}</AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
