'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useAuth } from '@/components/auth-provider';
import { addFavorite, getFavoriteStatus, removeFavorite } from '@/lib/favorites-client';

interface FavoriteButtonProps {
  placeId: string;
  /** Visual variant. */
  variant?: 'pill' | 'icon';
  /** Optional class override for `pill`. */
  className?: string;
}

export function FavoriteButton({ placeId, variant = 'pill', className }: FavoriteButtonProps) {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [favorited, setFavorited] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial status when user becomes available
  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setFavorited(false);
      return;
    }
    (async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;
      try {
        const isFav = await getFavoriteStatus(placeId, token);
        if (!cancelled) setFavorited(isFav);
      } catch {
        if (!cancelled) setFavorited(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, placeId, getAccessToken]);

  // Logged-out state: prompt to log in
  if (!authLoading && !user) {
    if (variant === 'icon') {
      return (
        <Link
          href={`/dang-nhap?next=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.pathname)}`}
          aria-label="Đăng nhập để lưu yêu thích"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-error shadow-md transition-transform hover:scale-105"
        >
          <Icon name="favorite_border" />
        </Link>
      );
    }
    return (
      <Link
        href="/dang-nhap"
        className={
          className ??
          'flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90'
        }
      >
        <Icon name="favorite_border" className="!text-base" />
        <span>Đăng nhập để yêu thích</span>
      </Link>
    );
  }

  const handleToggle = async () => {
    if (busy || authLoading || !user) return;
    setBusy(true);
    setError(null);
    const next = !(favorited ?? false);
    setFavorited(next); // optimistic
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.');
      if (next) {
        await addFavorite(placeId, token);
      } else {
        await removeFavorite(placeId, token);
      }
    } catch (e) {
      setFavorited(!next); // rollback
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || authLoading || favorited === null}
        aria-pressed={favorited ?? false}
        aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        title={error ?? undefined}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-error shadow-md transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name={favorited ? 'favorite' : 'favorite_border'} />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || authLoading || favorited === null}
        aria-pressed={favorited ?? false}
        className={
          className ??
          (favorited
            ? 'flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 py-3 font-bold text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
            : 'flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60')
        }
      >
        <Icon name={favorited ? 'favorite' : 'favorite_border'} className="!text-base" />
        <span>{favorited ? 'Đã yêu thích' : 'Thêm vào yêu thích'}</span>
      </button>
      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
