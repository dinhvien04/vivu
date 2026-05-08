'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlaceForm } from '@/components/admin/place-form';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import {
  adminDeletePlace,
  adminGetPlace,
  adminPublishPlace,
  adminUnpublishPlace,
} from '@/lib/admin-places-client';
import { listCategories, listRegions } from '@/lib/api';
import type { Category, Place, Region } from '@vivu/types';

interface PageProps {
  params: { slug: string };
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Bản nháp',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
};

export default function AdminPlaceEdit({ params }: PageProps) {
  const router = useRouter();
  const { getAccessToken, user, loading } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      setError(null);
      setNotFound(false);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
        const [p, rs, cs] = await Promise.all([
          adminGetPlace(params.slug, token),
          listRegions().catch(() => [] as Region[]),
          listCategories().catch(() => [] as Category[]),
        ]);
        if (cancelled) return;
        setPlace(p);
        setRegions(rs);
        setCategories(cs);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra';
        if (msg.toLowerCase().includes('không tìm thấy')) setNotFound(true);
        else setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, getAccessToken, params.slug]);

  const handleStatus = async (action: 'publish' | 'unpublish'): Promise<void> => {
    if (!place) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      const updated =
        action === 'publish'
          ? await adminPublishPlace(place.id, token)
          : await adminUnpublishPlace(place.id, token);
      setPlace(updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!place) return;
    const ok = window.confirm(`Xoá "${place.titleVi}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      await adminDeletePlace(place.id, token);
      router.push('/admin/dia-diem');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-h3 text-h3 text-on-surface">Không tìm thấy địa điểm</h1>
        <p className="text-body-md text-on-surface-variant">
          Slug <code>{params.slug}</code> không khớp địa điểm nào.
        </p>
        <Link
          href="/admin/dia-diem"
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white"
        >
          Về danh sách
        </Link>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
        {error ?? 'Đang tải địa điểm…'}
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav
            aria-label="Đường dẫn"
            className="mb-2 flex items-center gap-1 text-overline uppercase tracking-overline text-on-surface-variant"
          >
            <Link href="/admin" className="hover:text-primary">
              Admin
            </Link>
            <Icon name="chevron_right" className="!text-sm" />
            <Link href="/admin/dia-diem" className="hover:text-primary">
              Quản lý
            </Link>
            <Icon name="chevron_right" className="!text-sm" />
            <span className="text-primary">Chỉnh sửa</span>
          </nav>
          <h1 className="font-h2 text-h2 text-on-surface">{place.titleVi}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span>
              Slug: <code className="rounded bg-surface-container px-1.5 py-0.5">{place.slug}</code>
            </span>
            <span>·</span>
            <span
              className={
                place.status === 'published'
                  ? 'inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-on-secondary-container'
                  : 'inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5'
              }
            >
              <Icon
                name={place.status === 'published' ? 'check_circle' : 'edit_note'}
                className="!text-sm"
              />
              {STATUS_LABEL[place.status] ?? place.status}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-error/40 px-3 py-2 text-body-sm font-medium text-error hover:bg-error-container/30 disabled:opacity-60"
          >
            <Icon name="delete" className="!text-base" />
            Xoá
          </button>
          {place.status === 'published' ? (
            <button
              type="button"
              onClick={() => handleStatus('unpublish')}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
            >
              <Icon name="visibility_off" className="!text-base" />
              Hủy xuất bản
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStatus('publish')}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg bg-tertiary px-3 py-2 text-body-sm font-semibold text-on-tertiary hover:bg-tertiary/90 disabled:opacity-60"
            >
              <Icon name="rocket_launch" className="!text-base" />
              Xuất bản
            </button>
          )}
          <Link
            href={`/dia-diem/${place.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-body-sm font-medium text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="open_in_new" className="!text-base" />
            Xem trang
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      )}

      <PlaceForm mode="edit" initialPlace={place} regions={regions} categories={categories} />
    </>
  );
}
