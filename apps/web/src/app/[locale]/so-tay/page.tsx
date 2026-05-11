'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { createCollection, deleteCollection, listMyCollections } from '@/lib/collections-client';
import type { Collection } from '@vivu/types';

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SoTayListPage() {
  const t = useTranslations('collections');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/dang-nhap?next=/so-tay');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          router.replace('/dang-nhap?next=/so-tay');
          return;
        }
        const data = await listMyCollections(token);
        if (!cancelled) setCollections(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('errorGeneric'));
          setCollections([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken, t]);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (name.trim().length === 0) {
      setError(t('errorNameRequired'));
      return;
    }
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errorSessionExpired'));
      const created = await createCollection(
        { name: name.trim(), description: description.trim() || undefined },
        token,
      );
      setCollections((cs) => [created, ...(cs ?? [])]);
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, collectionName: string): Promise<void> => {
    const ok = window.confirm(t('deleteConfirmName', { name: collectionName }));
    if (!ok) return;
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errorSessionExpired'));
      await deleteCollection(id, token);
      setCollections((cs) => (cs ?? []).filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-overline uppercase tracking-overline text-secondary">
              {t('listOverline')}
            </p>
            <h1 className="mt-2 font-h1 text-h1 text-on-surface">{t('listTitle')}</h1>
            <p className="mt-3 font-sans text-body-lg text-on-surface-variant">{t('listLead')}</p>
          </div>
          {collections && collections.length > 0 && (
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Icon name={showForm ? 'close' : 'add'} className="!text-base" />
              {showForm ? t('cancel') : t('createNew')}
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-2xl border border-outline-variant bg-surface px-5 py-5 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="coll-name" className="mb-1 block text-label-md text-on-surface">
                  {t('fieldName')} <span className="text-error">*</span>
                </label>
                <input
                  id="coll-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder={t('fieldNameExample')}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="coll-desc" className="mb-1 block text-label-md text-on-surface">
                  {t('fieldDescription')}
                </label>
                <textarea
                  id="coll-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? t('creating') : t('create')}
              </button>
            </div>
          </form>
        )}

        {collections === null ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-surface-container"
                aria-hidden
              />
            ))}
          </ul>
        ) : collections.length === 0 ? (
          <EmptyState
            icon="collections_bookmark"
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={{ label: t('emptyAction'), onClick: () => setShowForm(true) }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <li
                key={c.id}
                className="group relative flex flex-col rounded-2xl border border-outline-variant bg-surface px-5 py-5 transition-all hover:border-primary/40 hover:shadow-premium"
              >
                <Link href={`/so-tay/${c.id}`} className="flex flex-1 flex-col">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-label-caps text-on-primary-container">
                      <Icon name="collections_bookmark" className="!text-sm" />
                      {t('itemsCount', { count: c.itemsCount })}
                    </span>
                    {c.isPublic && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-tertiary/40 bg-tertiary-container px-2 py-0.5 text-label-caps text-on-tertiary-container"
                        title={t('public')}
                      >
                        <Icon name="public" className="!text-sm" />
                        {t('public')}
                      </span>
                    )}
                  </div>
                  <h2 className="mb-1 font-h3 text-h3 text-on-surface group-hover:text-primary">
                    {c.name}
                  </h2>
                  {c.description && (
                    <p className="mb-3 text-body-sm text-on-surface-variant line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-auto text-label-caps text-on-surface-variant">
                    {t('updatedOn', { date: formatDate(c.updatedAt, locale) })}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  aria-label={t('deleteAriaLabel', { name: c.name })}
                  className="absolute right-3 top-3 rounded-full bg-white/0 p-2 text-on-surface-variant opacity-0 transition-all hover:bg-error-container hover:text-on-error-container group-hover:opacity-100"
                >
                  <Icon name="delete" className="!text-base" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
