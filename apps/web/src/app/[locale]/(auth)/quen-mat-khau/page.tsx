'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { Link } from '@/i18n/navigation';
import { AuthError, forgotPassword } from '@/lib/auth-client';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email, turnstileToken);
      setSent(email);
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : t('errorGeneric');
      setError(msg);
      setTurnstileToken('');
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <h1 className="font-h2 text-h2">{t('forgotTitle')}</h1>
        <p className="text-body-md text-on-surface-variant">{t('forgotLead')}</p>
      </div>

      {sent ? (
        <div className="flex flex-col gap-4 text-body-md">
          <p>
            {t.rich('forgotSent', {
              email: sent,
              strong: (chunks: ReactNode) => <strong className="text-on-surface">{chunks}</strong>,
            })}
          </p>
          <p className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
            {t('forgotDevNote')}
          </p>
          <Link
            href="/dang-nhap"
            className="self-start text-body-md font-semibold text-primary hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </div>
      ) : (
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
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/75 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
          </div>

          <TurnstileWidget
            siteKey={TURNSTILE_SITE_KEY}
            onToken={setTurnstileToken}
            resetKey={turnstileResetKey}
          />

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
            {submitting ? t('submittingForgot') : t('submitForgot')}
          </button>

          <p className="text-center text-body-sm text-on-surface-variant">
            {t('rememberPassword')}{' '}
            <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">
              {t('loginLinkLabel')}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
