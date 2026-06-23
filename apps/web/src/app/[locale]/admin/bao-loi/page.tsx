import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminDataReportsPage } from '@/components/admin/data-reports/admin-data-reports-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === 'en' ? 'Data reports' : 'Báo lỗi dữ liệu' };
}

export default async function AdminDataReportsRoute({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminDataReportsPage />;
}
