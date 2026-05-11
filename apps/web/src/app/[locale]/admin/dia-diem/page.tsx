'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { placeCategoryName, placeRegionName, placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import {
  adminDeletePlace,
  adminListPlaces,
  adminPublishPlace,
  adminUnpublishPlace,
} from '@/lib/admin-places-client';
import type { Place } from '@/lib/api';
import { listRegions } from '@/lib/api';
import type { Region } from '@vivu/types';

export default function AdminPlacesList() {
  const t = useTranslations('admin');
  const locale = useLocale() as Locale;
  const STATUS_LABEL: Record<string, string> = {
    draft: t('statusDraft'),
    published: t('statusPublished'),
    archived: t('statusArchived'),
  };
  const { getAccessToken, user, loading } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [region, setRegion] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [appliedQ, setAppliedQ] = useState<string>('');

  const refresh = useCallback(async () => {
    if (loading || !user) return;
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errSessionExpired'));
      const result = await adminListPlaces(token, {
        region: region || undefined,
        q: appliedQ || undefined,
        pageSize: 100,
      });
      setPlaces(result.data);
      setTotal(result.meta.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errGeneric'));
      setPlaces([]);
      setTotal(0);
    }
  }, [loading, user, getAccessToken, region, appliedQ, t]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const rs = await listRegions();
        if (!cancelled) setRegions(rs);
      } catch {
        /* ignore — filter just won't have options */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const parentRegions = useMemo(() => regions.filter((r) => r.parentId === null), [regions]);

  const handleAction = async (
    action: 'publish' | 'unpublish' | 'delete',
    place: Place,
  ): Promise<void> => {
    if (action === 'delete') {
      const ok = window.confirm(t('deleteConfirm', { title: placeTitle(place, locale) }));
      if (!ok) return;
    }
    setBusyId(place.id);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errSessionExpired'));
      if (action === 'publish') await adminPublishPlace(place.id, token);
      else if (action === 'unpublish') await adminUnpublishPlace(place.id, token);
      else await adminDeletePlace(place.id, token);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errGeneric'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">
            {t('breadcrumb')}
          </p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">{t('placesTitle')}</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">{t('placesLead')}</p>
        </div>
        <Link
          href="/admin/dia-diem/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
        >
          <Icon name="add" className="text-base" />
          {t('newPlace')}
        </Link>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedQ(q);
        }}
        className="mb-4 flex flex-col gap-3 md:flex-row"
      >
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('placesSearch')}
            className="w-full rounded-full border border-outline-variant bg-surface py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-semibold text-on-surface hover:bg-surface-container"
        >
          {t('placesSearchBtn')}
        </button>
      </form>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
        <button
          type="button"
          onClick={() => setRegion('')}
          className={
            region === ''
              ? 'rounded-full bg-primary px-4 py-1.5 text-body-sm font-semibold text-white'
              : 'rounded-full bg-surface-container px-4 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
          }
        >
          {t('regionAll')}
        </button>
        {parentRegions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegion(r.slug)}
            className={
              region === r.slug
                ? 'rounded-full bg-primary px-4 py-1.5 text-body-sm font-semibold text-white'
                : 'rounded-full bg-surface-container px-4 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
            }
          >
            {placeRegionName(r, locale)}
          </button>
        ))}
      </nav>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-outline-variant/40">
          <thead className="bg-surface-container/40">
            <tr className="text-left text-overline uppercase tracking-overline text-on-surface-variant">
              <th className="px-4 py-3">{t('colPlace')}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t('colRegion')}</th>
              <th className="hidden px-4 py-3 lg:table-cell">{t('colCategory')}</th>
              <th className="px-4 py-3">{t('colStatus')}</th>
              <th className="px-4 py-3 text-right">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-body-md">
            {places === null ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                  {t('tableLoading')}
                </td>
              </tr>
            ) : places.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                  {t('tableEmpty')}
                </td>
              </tr>
            ) : (
              places.map((p) => {
                const title = placeTitle(p, locale);
                return (
                <tr key={p.id} className="hover:bg-surface-container/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-md bg-surface-container">
                        {p.heroImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.heroImageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">{title}</p>
                        <p className="truncate text-body-sm text-on-surface-variant">
                          {p.address ?? t('noAddress')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-body-sm text-on-surface-variant">
                      {p.region ? placeRegionName(p.region, locale) : '—'}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(p.categories ?? []).slice(0, 2).map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full bg-secondary-container px-2 py-0.5 text-body-sm text-on-secondary-container"
                        >
                          {placeCategoryName(c, locale)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === 'published'
                          ? 'inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-body-sm text-on-secondary-container'
                          : 'inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-body-sm text-on-surface-variant'
                      }
                    >
                      <Icon
                        name={p.status === 'published' ? 'check_circle' : 'edit_note'}
                        className="!text-sm"
                      />
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => handleAction('unpublish', p)}
                          disabled={busyId === p.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
                        >
                          <Icon name="visibility_off" className="!text-sm" />
                          {t('unpublishShort')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAction('publish', p)}
                          disabled={busyId === p.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm font-medium text-tertiary hover:bg-tertiary-container/40 disabled:opacity-60"
                        >
                          <Icon name="rocket_launch" className="!text-sm" />
                          {t('publish')}
                        </button>
                      )}
                      <Link
                        href={`/admin/dia-diem/${p.slug}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm font-semibold text-primary hover:bg-primary-container/40"
                      >
                        <Icon name="edit" className="!text-sm" />
                        {t('edit')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAction('delete', p)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm font-medium text-error hover:bg-error-container/30 disabled:opacity-60"
                      >
                        <Icon name="delete" className="!text-sm" />
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container/40 px-4 py-2 text-body-sm text-on-surface-variant">
          <span>{t('totalPlaces', { total })}</span>
          <span>{t('allStatuses')}</span>
        </div>
      </div>
    </>
  );
}
