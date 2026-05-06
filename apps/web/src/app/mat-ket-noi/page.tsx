'use client';

import { useEffect, useState } from 'react';
import { StatusPage } from '@/components/status-page';

export default function OfflinePage() {
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
        overline="Đã kết nối"
        title="Đường truyền đã quay lại"
        description="Kết nối Internet của bạn đã được khôi phục. Hãy tiếp tục khám phá!"
        actions={[{ label: 'Tiếp tục', href: '/', variant: 'primary', icon: 'arrow_forward' }]}
      />
    );
  }

  return (
    <StatusPage
      icon="wifi_off"
      tone="warning"
      overline="Mất kết nối"
      title="Không có kết nối Internet"
      description={
        'Không thể tải dữ liệu vì kết nối Internet đã bị gián đoạn. Vui lòng kiểm tra mạng Wi-Fi hoặc dữ liệu di động và thử lại.'
      }
      actions={[
        {
          label: 'Thử lại',
          onClick: () => window.location.reload(),
          variant: 'primary',
          icon: 'refresh',
        },
      ]}
    />
  );
}
