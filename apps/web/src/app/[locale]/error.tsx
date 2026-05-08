'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { StatusPage } from '@/components/status-page';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errors');
  useEffect(() => {
    // Surface error to whatever logging hooks land in the future.
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <StatusPage
      icon="error"
      tone="error"
      overline={t('code500')}
      title={t('title500')}
      description={t('lead500')}
      actions={[
        { label: t('retryBtn'), onClick: reset, variant: 'primary', icon: 'refresh' },
        { label: t('homeBtn'), href: '/', variant: 'secondary' },
      ]}
    />
  );
}
