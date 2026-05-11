'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { Icon } from '@/components/icon';
import { Link, useRouter } from '@/i18n/navigation';
import { AuthError } from '@/lib/auth-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCardSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginCardSkeleton() {
  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="h-72 animate-pulse rounded-xl bg-surface-container-low" />
    </div>
  );
}

function LoginForm() {
  const t = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace(next);
      router.refresh();
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : t('errorGeneric');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <p className="text-body-md text-on-surface-variant">{t('loginTagline')}</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="email">
            {t('email').toUpperCase()}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@gmail.com"
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-label-caps text-on-surface-variant" htmlFor="password">
              {t('password').toUpperCase()}
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-[14px] text-primary transition-all hover:underline"
            >
              {t('forgotLink')}
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container"
          >
            <Icon name="error_outline" size={20} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-lg bg-primary py-4 font-h3 text-body-md text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('submittingLogin') : t('submitLogin')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-grow border-t border-outline-variant" />
        <span className="mx-4 bg-surface-container-lowest px-2 font-label-caps text-outline">
          {t('or').toUpperCase()}
        </span>
        <div className="h-px flex-grow border-t border-outline-variant" />
      </div>

      <GoogleAuthButton mode="login" />

      <p className="mt-6 text-center text-on-surface-variant">
        {t('registerCta')}
        <Link
          href={`/dang-ky${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-primary hover:underline"
        >
          {t('registerLinkLabel')}
        </Link>
      </p>
    </div>
  );
}
