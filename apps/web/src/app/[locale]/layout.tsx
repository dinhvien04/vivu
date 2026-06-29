import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider, THEME_PREFLIGHT_SCRIPT } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { getBuildInfo } from '@/lib/build-info';
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
    manifest: '/manifest.webmanifest',
    icons: {
      icon: '/vivu-logo.png',
      apple: '/vivu-logo.png',
    },
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
  const buildInfo = getBuildInfo();
  const app = (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <AuthProvider>{children}</AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="vivu-build-sha" content={buildInfo.commitSha} />
        {/* Apply the theme class before hydration to prevent a light-mode flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PREFLIGHT_SCRIPT }} />
      </head>
      <body>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            {app}
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
