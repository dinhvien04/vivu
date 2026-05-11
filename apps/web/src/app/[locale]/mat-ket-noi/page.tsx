'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { StatusPage } from '@/components/status-page';

export default function OfflinePage() {
  const t = useTranslations();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) {
    return (
      <StatusPage
        icon="wifi"
        tone="success"
        overline={t('errors.onlineOverline')}
        title={t('errors.onlineTitle')}
        description={t('errors.onlineLead')}
        actions={[
          { label: t('common.next'), href: '/', variant: 'primary', icon: 'arrow_forward' },
        ]}
      />
    );
  }

  return (
    <StatusPage
      icon="wifi_off"
      tone="warning"
      overline={t('errors.offlineTitle')}
      title={t('errors.offlineTitle')}
      description={t('errors.offlineLead')}
      actions={[
        {
          label: t('errors.retryBtn'),
          onClick: () => window.location.reload(),
          variant: 'primary',
          icon: 'refresh',
        },
      ]}
    />
  );
}
