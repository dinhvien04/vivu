import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TripPlannerPage } from '@/features/trip-planner/components/TripPlannerPage';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'AI Trip Planner' : 'Lich trinh AI',
    description:
      locale === 'en'
        ? 'Create a Gia Lai itinerary from Vivu place data.'
        : 'Tao lich trinh du lich Gia Lai bang du lieu dia danh cua Vivu.',
    alternates: {
      canonical: '/lich-trinh',
      languages: { vi: '/lich-trinh', en: '/en/lich-trinh' },
    },
  };
}

export default async function LichTrinhPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <TripPlannerPage />
      </main>
      <SiteFooter />
    </>
  );
}
