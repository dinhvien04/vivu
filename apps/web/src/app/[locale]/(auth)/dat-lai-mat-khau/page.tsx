'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { AuthError, resetPassword } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="h-72 animate-pulse rounded-xl bg-surface-container-low" />
    </div>
  );
}

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const search = useSearchParams();
  const token = search?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError(t('resetTokenInvalid'));
      return;
    }
    if (password !== confirm) {
      setError(t('errorPasswordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : t('errorGeneric');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-8 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <h1 className="mt-4 font-h3 text-h3 text-on-surface">{t('resetTitle')}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{t('resetLead')}</p>
      </div>

      {done ? (
        <div className="rounded-lg bg-primary-fixed p-5 text-center text-on-primary-fixed">
          <Icon name="check_circle" size={36} className="mx-auto mb-2 text-primary" />
          <p className="text-body-md font-semibold">{t('resetSuccess')}</p>
          <Link
            href="/dang-nhap"
            className="mt-4 inline-block font-semibold text-primary hover:underline"
          >
            {t('resetLoginNew')}
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-on-surface-variant" htmlFor="password">
              {t('newPassword') ? t('newPassword').toUpperCase() : t('password').toUpperCase()}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
            <p className="text-body-sm text-on-surface-variant/80">{t('passwordHint')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-on-surface-variant" htmlFor="confirm-password">
              {t('passwordConfirm').toUpperCase()}
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {submitting ? t('submittingReset') : t('submitReset')}
          </button>
        </form>
      )}
    </div>
  );
}
