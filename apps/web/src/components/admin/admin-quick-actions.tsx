'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';

interface QuickAction {
  labelKey: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

export function AdminQuickActions() {
  const t = useTranslations('admin');
  const [hint, setHint] = useState<string | null>(null);

  const exportReport = () => {
    setHint(t('exportSoon'));
    window.setTimeout(() => setHint(null), 4000);
  };

  const actions: QuickAction[] = [
    { labelKey: 'qaNewPlace', icon: 'add_location', href: '/admin/dia-diem/new' },
    { labelKey: 'qaModerate', icon: 'gavel', href: '/admin/danh-gia' },
    { labelKey: 'qaPlaces', icon: 'view_list', href: '/admin/dia-diem' },
    { labelKey: 'qaExport', icon: 'file_download', onClick: exportReport },
  ];

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-h4 text-h4 text-on-surface">{t('quickActions')}</h2>
        <Icon name="touch_app" className="text-primary" />
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {actions.map((a) =>
          a.href ? (
            <li key={a.labelKey}>
              <Link
                href={a.href}
                className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-3 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name={a.icon} className="!text-xl text-primary" />
                {t(a.labelKey)}
              </Link>
            </li>
          ) : (
            <li key={a.labelKey}>
              <button
                type="button"
                onClick={a.onClick}
                className="flex w-full items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-3 text-left text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name={a.icon} className="!text-xl text-primary" />
                {t(a.labelKey)}
              </button>
            </li>
          ),
        )}
      </ul>
      {hint && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
