'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { listAuditLogs, type AuditLogEntry } from '@/lib/audit-logs-client';

interface ActionMeta {
  icon: string;
  tone: string;
}

const ACTION_META: Record<string, ActionMeta> = {
  'place.create': { icon: 'add_location', tone: 'text-emerald-600' },
  'place.update': { icon: 'edit_location', tone: 'text-sky-600' },
  'place.publish': { icon: 'public', tone: 'text-emerald-600' },
  'place.unpublish': { icon: 'public_off', tone: 'text-amber-600' },
  'place.delete': { icon: 'delete_outline', tone: 'text-rose-600' },
  'place.photo.add': { icon: 'add_a_photo', tone: 'text-sky-600' },
  'place.photo.remove': { icon: 'image_not_supported', tone: 'text-rose-500' },
  'review.hide': { icon: 'visibility_off', tone: 'text-slate-500' },
  'review.restore': { icon: 'check_circle', tone: 'text-emerald-600' },
  'review.report': { icon: 'flag', tone: 'text-amber-600' },
  'review.delete': { icon: 'delete_outline', tone: 'text-rose-600' },
};

function metaFor(action: string): ActionMeta {
  return ACTION_META[action] ?? { icon: 'history', tone: 'text-on-surface-variant' };
}

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return iso;
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < minute) return locale === 'en' ? 'just now' : 'vừa xong';
  if (diff < hour) {
    const m = Math.round(diff / minute);
    return locale === 'en' ? `${m}m ago` : `${m} phút trước`;
  }
  if (diff < day) {
    const h = Math.round(diff / hour);
    return locale === 'en' ? `${h}h ago` : `${h} giờ trước`;
  }
  const d = Math.round(diff / day);
  return locale === 'en' ? `${d}d ago` : `${d} ngày trước`;
}

function summarize(entry: AuditLogEntry): string {
  const md = entry.metadata ?? {};
  const slug = typeof md.slug === 'string' ? md.slug : null;
  const photoId = typeof md.photoId === 'string' ? md.photoId.slice(0, 6) : null;
  if (slug) return slug;
  if (photoId) return `#${photoId}`;
  if (entry.entityId) return `#${entry.entityId.slice(0, 6)}`;
  return entry.entityType;
}

export function AdminRecentActivity() {
  const t = useTranslations('admin');
  const { getAccessToken, user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await listAuditLogs(token, { pageSize: 6 });
        if (!cancelled) setLogs(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, user]);

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'vi' : 'vi';

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-h4 text-h4 text-on-surface">{t('recentActivity')}</h2>
        <Icon name="bolt" className="text-primary" />
      </div>

      {logs === null && !error && (
        <ul className="space-y-3" aria-busy="true">
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
          <li className="h-12 animate-pulse rounded-lg bg-surface-container" />
        </ul>
      )}

      {error && <p className="text-body-sm text-on-surface-variant">{t('recentActivityError')}</p>}

      {logs && logs.length === 0 && (
        <p className="text-body-sm text-on-surface-variant">{t('noData')}</p>
      )}

      {logs && logs.length > 0 && (
        <ul className="divide-y divide-outline-variant/30">
          {logs.map((entry) => {
            const m = metaFor(entry.action);
            const actor = entry.actor?.name ?? t('auditActorSystem');
            const target = summarize(entry);
            const knownAction = entry.action in ACTION_META;
            const label = knownAction
              ? t(`auditAction.${entry.action}` as 'auditAction.fallback', { actor, target })
              : t('auditAction.fallback', { actor, target: entry.action });
            return (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <Icon name={m.icon} className={`!text-xl ${m.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-semibold text-on-surface">{label}</p>
                  <p className="line-clamp-1 text-body-sm text-on-surface-variant">
                    {entry.entityType} · {summarize(entry)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-overline tracking-overline text-outline">
                  {timeAgo(entry.createdAt, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
