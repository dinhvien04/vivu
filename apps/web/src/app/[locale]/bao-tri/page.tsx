import { getTranslations } from 'next-intl/server';
import { StatusPage } from '@/components/status-page';

export async function generateMetadata() {
  const t = await getTranslations('errors');
  return {
    title: t('maintenanceTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function MaintenancePage() {
  const t = await getTranslations();
  return (
    <StatusPage
      icon="construction"
      tone="warning"
      overline={t('errors.maintenanceTitle')}
      title={t('errors.maintenanceTitle')}
      description={t('errors.maintenanceLead')}
      actions={[
        {
          label: t('errors.retryBtn'),
          href: '/',
          variant: 'primary',
          icon: 'refresh',
        },
      ]}
    >
      <dl className="mx-auto grid grid-cols-1 gap-4 rounded-2xl border border-outline-variant bg-surface-container/40 p-6 text-left sm:grid-cols-2">
        <div>
          <dt className="text-overline uppercase tracking-overline text-secondary">
            {t('errors.maintenanceStatusLabel')}
          </dt>
          <dd className="mt-1 font-h4 text-h4 text-on-surface">
            {t('errors.maintenanceStatusValue')}
          </dd>
          <dd className="text-body-sm text-on-surface-variant">
            {t('errors.maintenanceStatusHint')}
          </dd>
        </div>
        <div>
          <dt className="text-overline uppercase tracking-overline text-secondary">
            {t('errors.maintenanceEtaLabel')}
          </dt>
          <dd className="mt-1 font-h4 text-h4 text-primary">{t('errors.maintenanceEtaValue')}</dd>
          <dd className="text-body-sm text-on-surface-variant">{t('errors.maintenanceEtaHint')}</dd>
        </div>
      </dl>
    </StatusPage>
  );
}
