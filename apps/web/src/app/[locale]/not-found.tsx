import { getTranslations } from 'next-intl/server';
import { StatusPage } from '@/components/status-page';

export async function generateMetadata() {
  const t = await getTranslations('errors');
  return { title: t('metaTitle404') };
}

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <StatusPage
      icon="explore_off"
      tone="info"
      overline={t('code404')}
      title={t('title404')}
      description={t('lead404')}
      actions={[
        { label: t('homeBtn'), href: '/', variant: 'primary', icon: 'home' },
        { label: t('exploreBtn'), href: '/kham-pha', variant: 'secondary' },
      ]}
    />
  );
}
