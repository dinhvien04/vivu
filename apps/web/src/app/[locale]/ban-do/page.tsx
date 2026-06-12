import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { Locale } from '@/i18n/routing';
import { listPlaces } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'map' });
  return { title: t('title') };
}

export default async function MapPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'map' });

  const result = await listPlaces({ province: 'Gia Lai', pageSize: 100 }).catch(() => null);
  const total = result?.meta.total ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-6">
          <span className="text-overline uppercase tracking-overline text-primary">
            {t('overline')}
          </span>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('title')}</h1>
          <p className="mt-3 max-w-3xl text-body text-on-surface-variant">{t('lead')}</p>
        </header>
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/40 px-6 text-center">
          <Icon name="map" className="!text-6xl text-primary" />
          <h2 className="mt-5 font-h3 text-h3 text-on-surface">{t('updating')}</h2>
          <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
            {t('updatingLead', { total })}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
