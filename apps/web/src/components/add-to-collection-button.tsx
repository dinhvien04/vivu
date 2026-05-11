'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { addCollectionItem, createCollection, listMyCollections } from '@/lib/collections-client';
import type { Collection } from '@vivu/types';

interface AddToCollectionButtonProps {
  placeId: string;
  placeTitle: string;
}

type Status = 'idle' | 'busy' | 'done';

export function AddToCollectionButton({ placeId, placeTitle }: AddToCollectionButtonProps) {
  const t = useTranslations('collectionBtn');
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!open) return;
    if (!user) return;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error(t('sessionExpired'));
        const data = await listMyCollections(token);
        if (!cancelled) setCollections(data);
      } catch (e) {
        if (!cancelled) {
          setCollections([]);
          setError(e instanceof Error ? e.message : t('loadFailed'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, getAccessToken, t]);

  if (!authLoading && !user) {
    return (
      <Link
        href={`/dang-nhap?next=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname)}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-3 font-bold text-primary transition-all hover:bg-primary/10"
      >
        <Icon name="bookmark_add" className="!text-base" />
        <span>{t('signIn')}</span>
      </Link>
    );
  }

  const handleAdd = async (collection: Collection): Promise<void> => {
    setError(null);
    setStatus('busy');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('sessionExpired'));
      await addCollectionItem(collection.id, placeId, token);
      setSavedTo(collection.name);
      setStatus('done');
      setTimeout(() => setOpen(false), 1200);
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : t('addFailed'));
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (newName.trim().length === 0) {
      setError(t('nameRequired'));
      return;
    }
    setError(null);
    setStatus('busy');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('sessionExpired'));
      const created = await createCollection({ name: newName.trim() }, token);
      await addCollectionItem(created.id, placeId, token);
      setSavedTo(created.name);
      setStatus('done');
      setNewName('');
      setShowCreate(false);
      setCollections((cs) => [created, ...(cs ?? [])]);
      setTimeout(() => setOpen(false), 1200);
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : t('createFailed'));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus('idle');
          setSavedTo(null);
          setError(null);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-3 font-bold text-primary transition-all hover:bg-primary/10"
      >
        <Icon name="bookmark_add" className="!text-base" />
        <span>{t('add')}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('dialogTitle')}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-8 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && status !== 'busy') setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <div>
                <h3 className="font-h4 text-h4 text-on-surface">{t('dialogTitle')}</h3>
                <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
                  {placeTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('close')}
                disabled={status === 'busy'}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container disabled:cursor-not-allowed"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-error/40 bg-error-container px-3 py-2 text-body-sm text-on-error-container"
                >
                  {error}
                </div>
              )}

              {status === 'done' && savedTo && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-tertiary-container px-3 py-2 text-body-sm text-on-tertiary-container">
                  <Icon name="check_circle" className="!text-base" />
                  {t('savedTo', { name: savedTo })}
                </div>
              )}

              {showCreate ? (
                <form onSubmit={handleCreateAndAdd} className="space-y-3">
                  <label htmlFor="new-coll" className="block text-label-md text-on-surface">
                    {t('newNameLabel')} <span className="text-error">*</span>
                  </label>
                  <input
                    id="new-coll"
                    type="text"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={120}
                    placeholder={t('newNamePlaceholder')}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={status === 'busy'}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {status === 'busy' ? t('creatingBtn') : t('createAddBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        setNewName('');
                      }}
                      className="rounded-lg px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container"
                    >
                      {t('backBtn')}
                    </button>
                  </div>
                </form>
              ) : collections === null ? (
                <ul className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-surface-container"
                      aria-hidden
                    />
                  ))}
                </ul>
              ) : collections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-outline-variant px-4 py-6 text-center">
                  <p className="mb-3 text-body-md text-on-surface-variant">{t('empty')}</p>
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
                  >
                    <Icon name="add" className="!text-base" />
                    {t('createFirstBtn')}
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleAdd(c)}
                        disabled={status === 'busy'}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-outline-variant px-4 py-3 text-left transition-all hover:border-primary hover:bg-primary-container/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div>
                          <p className="font-semibold text-on-surface">{c.name}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            {t('placesCount', { count: c.itemsCount })}
                          </p>
                        </div>
                        <Icon name="add_circle" className="!text-2xl text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!showCreate && collections && collections.length > 0 && (
              <div className="border-t border-outline-variant px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 text-body-md font-semibold text-primary hover:underline"
                >
                  <Icon name="add" className="!text-base" />
                  {t('createNewBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
