'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  deleteCollection,
  getCollection,
  removeCollectionItem,
  updateCollection,
} from '@/lib/collections-client';
import { hasPlaceImage } from '@/lib/place-image';
import type { Collection } from '@vivu/types';

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SoTayDetailPage() {
  const t = useTranslations('collections');
  const params = useParams<{ id: string }>();
  const id = params.id;
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const back = `/so-tay`;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/dang-nhap?next=${encodeURIComponent(`/so-tay/${id}`)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          router.replace(`/dang-nhap?next=${encodeURIComponent(`/so-tay/${id}`)}`);
          return;
        }
        const data = await getCollection(id, token);
        if (cancelled) return;
        setCollection(data);
        setName(data.name);
        setDescription(data.description ?? '');
        setIsPublic(data.isPublic);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : t('loadFailed'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken, id, t]);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setActionError(null);
    if (name.trim().length === 0) {
      setActionError(t('errorNameRequired'));
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errorSessionExpired'));
      const updated = await updateCollection(
        id,
        {
          name: name.trim(),
          description: description.trim(),
          isPublic,
        },
        token,
      );
      setCollection((c) => (c ? { ...c, ...updated, items: c.items } : updated));
      setEditing(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (): Promise<void> => {
    if (!collection) return;
    const ok = window.confirm(t('deleteConfirmName', { name: collection.name }));
    if (!ok) return;
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errorSessionExpired'));
      await deleteCollection(id, token);
      router.push('/so-tay');
      router.refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('errorGeneric'));
    }
  };

  const handleRemoveItem = async (placeId: string, title: string): Promise<void> => {
    const ok = window.confirm(t('removePlaceConfirm', { name: title }));
    if (!ok) return;
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errorSessionExpired'));
      await removeCollectionItem(id, placeId, token);
      setCollection((c) =>
        c
          ? {
              ...c,
              items: (c.items ?? []).filter((i) => i.placeId !== placeId),
              itemsCount: Math.max(0, c.itemsCount - 1),
            }
          : c,
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('errorGeneric'));
    }
  };

  if (loadError) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <Link
            href={back}
            className="mb-6 inline-flex items-center gap-1 text-body-md text-primary hover:underline"
          >
            <Icon name="arrow_back" className="!text-base" /> {t('listTitle')}
          </Link>
          <EmptyState
            icon="error"
            title={t('loadFailed')}
            description={loadError}
            action={{ label: t('detailBack'), href: back }}
          />
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!collection) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <div className="h-8 w-40 animate-pulse rounded bg-surface-container" />
          <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-surface-container" />
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-72 animate-pulse rounded-xl bg-surface-container"
                aria-hidden
              />
            ))}
          </ul>
        </main>
        <SiteFooter />
      </>
    );
  }

  const items = collection.items ?? [];
  const visibleItems = items.filter((item) => hasPlaceImage(item.place));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <Link
          href={back}
          className="mb-6 inline-flex items-center gap-1 text-body-md text-primary hover:underline"
        >
          <Icon name="arrow_back" className="!text-base" /> {t('listTitle')}
        </Link>

        {editing ? (
          <form
            onSubmit={handleSave}
            className="mb-8 rounded-2xl border border-outline-variant bg-surface px-5 py-5 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-label-md text-on-surface">
                  {t('fieldName')} <span className="text-error">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="edit-desc" className="mb-1 block text-label-md text-on-surface">
                  {t('fieldDescription')}
                </label>
                <textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-body-md text-on-surface">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                {t('publicToggleLabel')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? t('saving') : t('saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(collection.name);
                    setDescription(collection.description ?? '');
                    setIsPublic(collection.isPublic);
                  }}
                  className="rounded-lg border border-outline-variant px-5 py-2 font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-overline uppercase tracking-overline text-secondary">
                {t('listOverline')}
              </p>
              <h1 className="mt-2 font-h1 text-h1 text-on-surface">{collection.name}</h1>
              {collection.description && (
                <p className="mt-3 text-body-lg text-on-surface-variant">
                  {collection.description}
                </p>
              )}
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
                  <Icon name="collections_bookmark" className="!text-sm" />
                  {t('itemsCount', { count: collection.itemsCount })}
                </span>
                {collection.isPublic && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-tertiary/40 bg-tertiary-container px-3 py-1 text-on-tertiary-container">
                    <Icon name="public" className="!text-sm" />
                    {t('public')}
                  </span>
                )}
                <span>· {t('updatedOn', { date: formatDate(collection.updatedAt, locale) })}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="edit" className="!text-base" />
                {t('edit')}
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                className="inline-flex items-center gap-2 rounded-lg border border-error/40 px-4 py-2 font-medium text-error hover:bg-error-container hover:text-on-error-container"
              >
                <Icon name="delete" className="!text-base" />
                {t('deleteCollection')}
              </button>
            </div>
          </header>
        )}

        {actionError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {actionError}
          </div>
        )}

        {visibleItems.length === 0 ? (
          <EmptyState
            icon="bookmark_border"
            title={t('emptySoTay')}
            description={t('emptySoTayDescription')}
            action={{ label: t('addPlaceCta'), href: '/kham-pha' }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((it) =>
              hasPlaceImage(it.place) ? (
                <li key={it.placeId} className="relative">
                  <PlaceCard place={it.place} locale={locale} />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.placeId, it.place!.titleVi)}
                    aria-label={t('removePlaceAria', { name: it.place.titleVi })}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-on-surface-variant shadow-sm transition-colors hover:bg-error-container hover:text-on-error-container"
                  >
                    <Icon name="delete" className="!text-base" />
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
