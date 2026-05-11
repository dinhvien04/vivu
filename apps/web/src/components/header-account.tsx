'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from './auth-provider';
import { Icon } from './icon';

/**
 * Right-side account widget in the desktop SiteHeader. Shows:
 * - When logged out: a "Đăng nhập" button.
 * - When logged in: avatar + name + dropdown with profile / admin / logout.
 */
export function HeaderAccount() {
  const t = useTranslations('common');
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="block h-9 w-9 animate-pulse rounded-full bg-surface-container"
      />
    );
  }

  if (!user) {
    const next =
      pathname && pathname !== '/dang-nhap' && pathname !== '/dang-ky'
        ? `?next=${encodeURIComponent(pathname)}`
        : '';
    return (
      <Link
        href={`/dang-nhap${next}`}
        className="rounded-full px-4 py-2 text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
      >
        {t('signIn')}
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || 'V';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t('accountMenu', { name: user.name })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-body-md font-bold text-on-primary transition-shadow hover:shadow-md"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-xl"
        >
          <div className="border-b border-outline-variant/30 px-4 py-3">
            <p className="text-body-md font-semibold text-on-surface">{user.name}</p>
            <p className="truncate text-body-sm text-on-surface-variant">{user.email}</p>
            {user.role !== 'user' && (
              <span className="mt-2 inline-block rounded-full bg-primary-fixed px-2 py-0.5 font-label-caps text-on-primary-fixed">
                {user.role.toUpperCase()}
              </span>
            )}
          </div>
          <ul className="py-2">
            <li>
              <Link
                href="/tai-khoan"
                className="flex items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                role="menuitem"
              >
                <Icon name="person" size={20} className="text-outline" />
                {t('accountProfile')}
              </Link>
            </li>
            <li>
              <Link
                href="/tai-khoan/yeu-thich"
                className="flex items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                role="menuitem"
              >
                <Icon name="favorite" size={20} className="text-outline" />
                {t('accountFavorites')}
              </Link>
            </li>
            <li>
              <Link
                href="/so-tay"
                className="flex items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                role="menuitem"
              >
                <Icon name="collections_bookmark" size={20} className="text-outline" />
                {t('accountCollections')}
              </Link>
            </li>
            <li>
              <Link
                href="/tai-khoan/cai-dat"
                className="flex items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                role="menuitem"
              >
                <Icon name="settings" size={20} className="text-outline" />
                {t('accountSettings')}
              </Link>
            </li>
            {(user.role === 'admin' || user.role === 'editor') && (
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                  role="menuitem"
                >
                  <Icon name="admin_panel_settings" size={20} className="text-outline" />
                  {t('accountAdmin')}
                </Link>
              </li>
            )}
          </ul>
          <div className="border-t border-outline-variant/30 py-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
                setOpen(false);
                router.replace('/');
                router.refresh();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
              role="menuitem"
            >
              <Icon name="logout" size={20} className="text-outline" />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
