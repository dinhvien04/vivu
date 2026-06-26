import { setRequestLocale } from 'next-intl/server';
import { AdminLeadsPage } from '@/components/admin/leads/admin-leads-page';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<{ title: string }> {
  const { locale } = await params;
  return { title: locale === 'en' ? 'Leads' : 'Lead tư vấn' };
}

export default async function AdminLeadsRoute({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminLeadsPage />;
}
