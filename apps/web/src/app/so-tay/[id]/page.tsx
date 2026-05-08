'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { PlaceCard } from '@/components/place-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  deleteCollection,
  getCollection,
  removeCollectionItem,
  updateCollection,
} from '@/lib/collections-client';
import type { Collection } from '@vivu/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SoTayDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
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
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Không tải được sổ tay');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken, id]);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setActionError(null);
    if (name.trim().length === 0) {
      setActionError('Tên sổ tay không được để trống.');
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      const updated = await updateCollection(
        id,
        {
          name: name.trim(),
          description: description.trim(),
          isPublic,
        },
        token,
      );
      // Patch local copy with new metadata while preserving items.
      setCollection((c) => (c ? { ...c, ...updated, items: c.items } : updated));
      setEditing(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (): Promise<void> => {
    if (!collection) return;
    const ok = window.confirm(`Xoá sổ tay "${collection.name}"?`);
    if (!ok) return;
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      await deleteCollection(id, token);
      router.push('/so-tay');
      router.refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Không xoá được');
    }
  };

  const handleRemoveItem = async (placeId: string, title: string): Promise<void> => {
    const ok = window.confirm(`Bỏ "${title}" khỏi sổ tay?`);
    if (!ok) return;
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
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
      setActionError(e instanceof Error ? e.message : 'Không bỏ được khỏi sổ tay');
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
            <Icon name="arrow_back" className="!text-base" /> Tất cả sổ tay
          </Link>
          <EmptyState
            icon="error"
            title="Không tải được sổ tay"
            description={loadError}
            action={{ label: 'Quay lại danh sách', href: back }}
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <Link
          href={back}
          className="mb-6 inline-flex items-center gap-1 text-body-md text-primary hover:underline"
        >
          <Icon name="arrow_back" className="!text-base" /> Tất cả sổ tay
        </Link>

        {editing ? (
          <form
            onSubmit={handleSave}
            className="mb-8 rounded-2xl border border-outline-variant bg-surface px-5 py-5 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-label-md text-on-surface">
                  Tên sổ tay <span className="text-error">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="edit-desc" className="mb-1 block text-label-md text-on-surface">
                  Mô tả ngắn
                </label>
                <textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-body-md text-on-surface">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Công khai (cho phép chia sẻ link)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
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
                  Huỷ
                </button>
              </div>
            </div>
          </form>
        ) : (
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-overline uppercase tracking-overline text-secondary">Sổ tay</p>
              <h1 className="mt-2 font-h1 text-h1 text-on-surface">{collection.name}</h1>
              {collection.description && (
                <p className="mt-3 text-body-lg text-on-surface-variant">
                  {collection.description}
                </p>
              )}
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
                  <Icon name="collections_bookmark" className="!text-sm" />
                  {collection.itemsCount} địa điểm
                </span>
                {collection.isPublic && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-tertiary/40 bg-tertiary-container px-3 py-1 text-on-tertiary-container">
                    <Icon name="public" className="!text-sm" />
                    Công khai
                  </span>
                )}
                <span>· Cập nhật {formatDate(collection.updatedAt)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="edit" className="!text-base" />
                Sửa
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                className="inline-flex items-center gap-2 rounded-lg border border-error/40 px-4 py-2 font-medium text-error hover:bg-error-container hover:text-on-error-container"
              >
                <Icon name="delete" className="!text-base" />
                Xoá
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

        {items.length === 0 ? (
          <EmptyState
            icon="bookmark_border"
            title="Sổ tay đang trống"
            description="Vào trang chi tiết của một địa điểm và bấm 'Thêm vào sổ tay' để gom vào đây."
            action={{ label: 'Khám phá địa điểm', href: '/kham-pha' }}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) =>
              it.place ? (
                <li key={it.placeId} className="relative">
                  <PlaceCard place={it.place} />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.placeId, it.place!.titleVi)}
                    aria-label={`Bỏ ${it.place.titleVi} khỏi sổ tay`}
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
