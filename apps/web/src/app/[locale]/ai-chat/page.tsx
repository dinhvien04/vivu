import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { AiChatPage } from '@/features/ai-chat/components/AiChatPage';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<{ title: string; description: string }> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aiChat' });
  return { title: t('title'), description: t('description') };
}

export default async function AiChatRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ place?: string }>;
}) {
  const { locale } = await params;
  const placeSlug = (await searchParams)?.place;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-5rem)] bg-surface px-margin-mobile md:px-margin-desktop">
        <AiChatPage placeSlug={placeSlug} />
      </main>
      <SiteFooter />
    </>
  );
}
