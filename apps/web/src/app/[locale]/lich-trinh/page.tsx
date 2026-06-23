import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TripPlannerPage } from '@/features/trip-planner/components/TripPlannerPage';
import type { Locale } from '@/i18n/routing';
import { placeTitle } from '@/i18n/place';
import { getPlaceBySlug } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === 'en'
        ? 'Plan your Gia Lai trip with AI | Vivu'
        : 'Lập lịch trình du lịch Gia Lai bằng AI | Vivu',
    description:
      locale === 'en'
        ? 'Create a travel itinerary by days, area, interests and budget from Vivu destination data.'
        : 'Tạo lịch trình du lịch theo số ngày, khu vực, sở thích và ngân sách dựa trên dữ liệu địa danh Vivu.',
    alternates: {
      canonical: '/lich-trinh',
      languages: { vi: '/lich-trinh', en: '/en/lich-trinh' },
    },
  };
}

export default async function LichTrinhPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ place?: string }>;
}) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  setRequestLocale(locale);
  let initialPlace: { slug: string; title: string } | undefined;

  if (sp.place) {
    try {
      const place = await getPlaceBySlug(sp.place);
      initialPlace = { slug: place.slug, title: placeTitle(place, locale) };
    } catch {
      initialPlace = { slug: sp.place, title: sp.place };
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <TripPlannerPage initialPlace={initialPlace} />
      </main>
      <SiteFooter />
    </>
  );
}
