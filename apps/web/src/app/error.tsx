'use client';

import { useEffect } from 'react';
import { StatusPage } from '@/components/status-page';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Surface error to whatever logging hooks land in the future.
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <StatusPage
      icon="error"
      tone="error"
      overline="Lỗi 500"
      title="Có lỗi xảy ra"
      description={
        'Hệ thống đang tạm thời gặp sự cố. Vui lòng thử lại sau ít phút.\nNếu vấn đề tiếp diễn, hãy liên hệ với chúng tôi.'
      }
      actions={[
        { label: 'Thử lại', onClick: reset, variant: 'primary', icon: 'refresh' },
        { label: 'Về trang chủ', href: '/', variant: 'secondary' },
      ]}
    />
  );
}
