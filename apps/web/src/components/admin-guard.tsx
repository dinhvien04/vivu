'use client';

import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from './auth-provider';
import { Icon } from './icon';

interface AdminGuardProps {
  children: ReactNode;
  /** Roles allowed inside this guard. Defaults to ['admin']. */
  allowedRoles?: string[];
}

/**
 * Client-side guard for /admin pages. Renders children only when the current
 * user has one of the allowed roles. Otherwise shows a loading or denied state
 * and (for unauthenticated users) redirects to /dang-nhap with a `next` param.
 *
 * Note: the underlying API is not yet auth-gated, so this is a UX-level guard.
 * A follow-up will move admin endpoints behind the JwtAuthGuard + RolesGuard.
 */
export function AdminGuard({ children, allowedRoles = ['admin', 'editor'] }: AdminGuardProps) {
  const t = useTranslations('admin');
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/admin';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-body-md text-on-surface-variant">{t('guardAuthenticating')}</p>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <Icon name="lock" size={32} />
        </div>
        <h1 className="font-h2 text-h2 text-on-surface">{t('guardForbiddenTitle')}</h1>
        <p className="text-body-md text-on-surface-variant">{t('guardForbiddenLead')}</p>
        <p
          className="text-body-sm text-on-surface-variant/80"
          dangerouslySetInnerHTML={{
            __html: t.raw('guardForbiddenAccount', {
              email: user.email,
              role: user.role,
            }) as string,
          }}
        />
        <Link
          href="/"
          className="mt-2 rounded-full bg-primary px-6 py-2 font-semibold text-on-primary transition-colors hover:bg-primary-container"
        >
          {t('guardHomeBtn')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
