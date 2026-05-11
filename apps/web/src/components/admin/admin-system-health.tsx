'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';

type Status = 'pending' | 'ok' | 'down';

interface HealthCheck {
  label: string;
  status: Status;
  detail?: string;
}

export function AdminSystemHealth() {
  const t = useTranslations('admin');
  const [api, setApi] = useState<HealthCheck>({ label: 'api', status: 'pending' });
  const [db, setDb] = useState<HealthCheck>({ label: 'db', status: 'pending' });
  const [cdn, setCdn] = useState<HealthCheck>({ label: 'cdn', status: 'pending' });

  useEffect(() => {
    let cancelled = false;
    // API: hits Next.js proxy /api/places which forwards to NestJS — proves both
    // the web layer and the API + DB connectivity.
    (async () => {
      const start = performance.now();
      try {
        const r = await fetch('/api/places?pageSize=1', { cache: 'no-store' });
        const ms = Math.round(performance.now() - start);
        if (cancelled) return;
        if (r.ok) {
          setApi({ label: 'api', status: 'ok', detail: `HTTP 200 · ${ms}ms` });
          setDb({ label: 'db', status: 'ok', detail: t('healthDbDetail') });
        } else {
          setApi({ label: 'api', status: 'down', detail: `HTTP ${r.status}` });
          setDb({ label: 'db', status: 'down' });
        }
      } catch (e) {
        if (cancelled) return;
        setApi({
          label: 'api',
          status: 'down',
          detail: e instanceof Error ? e.message : 'unknown',
        });
        setDb({ label: 'db', status: 'down' });
      }
    })();

    // CDN check: ping Cloudinary's tiny pixel (no auth needed)
    (async () => {
      try {
        const r = await fetch('https://res.cloudinary.com/demo/image/upload/w_1,h_1/sample.jpg', {
          cache: 'no-store',
        });
        if (cancelled) return;
        setCdn({
          label: 'cdn',
          status: r.ok ? 'ok' : 'down',
          detail: r.ok ? t('healthCdnDetail') : `HTTP ${r.status}`,
        });
      } catch {
        if (cancelled) return;
        setCdn({ label: 'cdn', status: 'down' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const items: HealthCheck[] = [
    { ...api, label: t('healthApi') },
    { ...db, label: t('healthDb') },
    { ...cdn, label: t('healthCdn') },
  ];

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-h4 text-h4 text-on-surface">{t('systemHealth')}</h2>
        <Icon name="health_and_safety" className="text-primary" />
      </div>
      <ul className="space-y-3">
        {items.map((it, i) => {
          const tone =
            it.status === 'ok'
              ? 'text-emerald-600'
              : it.status === 'down'
                ? 'text-rose-600'
                : 'text-on-surface-variant';
          const icon =
            it.status === 'ok' ? 'check_circle' : it.status === 'down' ? 'error' : 'hourglass_top';
          return (
            <li key={i} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-body-md text-on-surface">
                <Icon name={icon} className={`!text-xl ${tone}`} />
                {it.label}
              </span>
              <span className="truncate text-body-sm text-on-surface-variant">
                {it.detail ?? t('healthPending')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
