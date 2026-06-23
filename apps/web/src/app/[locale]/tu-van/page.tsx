import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LeadFormPage } from '@/features/leads/components/LeadFormPage';
import type { Locale } from '@/i18n/routing';
import type { LeadSource } from '@vivu/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    source?: LeadSource;
    place?: string;
    placeName?: string;
    note?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'Travel Consultation' : 'Tu van du lich',
    description:
      locale === 'en'
        ? 'Request travel consultation from Vivu.'
        : 'Gui yeu cau tu van lich trinh du lich voi Vivu.',
    alternates: {
      canonical: '/tu-van',
      languages: { vi: '/tu-van', en: '/en/tu-van' },
    },
  };
}

export default async function TuVanPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <LeadFormPage
          initialSource={sp.source}
          initialPlaceSlug={sp.place}
          initialPlaceName={sp.placeName}
          initialNote={sp.note}
        />
      </main>
      <SiteFooter />
    </>
  );
}
