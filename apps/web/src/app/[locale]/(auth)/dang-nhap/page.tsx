'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { useAuth as useVivuAuth } from '@/components/auth-provider';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { Icon } from '@/components/icon';
import { Link, useRouter } from '@/i18n/navigation';
import { AuthError } from '@/lib/auth-client';
import { getSafeAuthRedirect } from '@/lib/auth-redirect';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCardSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginCardSkeleton() {
  return (
    <div className="grid w-full max-w-6xl overflow-hidden rounded border border-outline-variant/40 bg-surface-container-lowest shadow-[0_24px_70px_-42px_rgba(15,30,55,0.45)] lg:grid-cols-[0.92fr_1.08fr]">
      <div className="h-72 animate-pulse bg-primary-fixed lg:h-[640px]" />
      <div className="flex min-h-[420px] items-center justify-center p-6 sm:p-10">
        <div className="h-80 w-full max-w-[430px] animate-pulse rounded bg-surface-container-low" />
      </div>
    </div>
  );
}

function LoginForm() {
  const search = useSearchParams();
  const next = getSafeAuthRedirect(search?.get('next') ?? null, '/');

  return (
    <AuthShell mode="login">
      <LegacyLoginForm next={next} />
    </AuthShell>
  );
}

function LegacyLoginForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const { login } = useVivuAuth();
  const router = useRouter();

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
    <div className="w-full max-w-[450px] rounded-3xl border border-white/20 dark:border-neutral-800/40 bg-white/70 dark:bg-neutral-950/75 backdrop-blur-xl p-8 md:p-10 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.18)]">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Vivu
        </span>
        <p className="text-body-md font-medium text-neutral-500 dark:text-neutral-400">
          {t('loginTagline')}
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            htmlFor="email"
          >
            {t('email')}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 flex items-center text-neutral-400 dark:text-neutral-500">
              <Icon name="mail" size={20} />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@gmail.com"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 pl-11 pr-4 py-3.5 text-body-md outline-none transition-all placeholder:text-neutral-400/80 dark:placeholder:text-neutral-600 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              htmlFor="password"
            >
              {t('password')}
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-[13px] font-semibold text-primary transition-all hover:underline"
            >
              {t('forgotLink')}
            </Link>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 flex items-center text-neutral-400 dark:text-neutral-500">
              <Icon name="lock" size={20} />
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 pl-11 pr-4 py-3.5 text-body-md outline-none transition-all placeholder:text-neutral-400/80 dark:placeholder:text-neutral-600 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 p-3.5 text-body-sm text-red-600 dark:text-red-400"
          >
            <Icon name="error_outline" size={20} className="mt-0.5 shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-xl bg-primary py-3.5 font-semibold text-body-md text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 hover:bg-opacity-95"
        >
          {submitting ? t('submittingLogin') : t('submitLogin')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-grow border-t border-neutral-200 dark:border-neutral-800" />
        <span className="mx-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {t('or')}
        </span>
        <div className="h-px flex-grow border-t border-neutral-200 dark:border-neutral-800" />
      </div>

      <GoogleAuthButton mode="login" next={next} />

      <p className="mt-6 text-center text-body-sm text-neutral-500 dark:text-neutral-400">
        {t('registerCta')}
        <Link
          href={`/dang-ky${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-bold text-primary hover:underline ml-1"
        >
          {t('registerLinkLabel')}
        </Link>
      </p>
    </div>
  );
}
