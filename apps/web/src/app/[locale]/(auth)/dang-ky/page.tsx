'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link, useRouter } from '@/i18n/navigation';
import { AuthError } from '@/lib/auth-client';

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterCardSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterCardSkeleton() {
  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="h-96 animate-pulse rounded-xl bg-surface-container-low" />
    </div>
  );
}

function RegisterForm() {
  const t = useTranslations('auth');
  const { register } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get('next') ?? '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t('errorPasswordMismatch'));
      return;
    }
    if (!agree) {
      setError(t('errorAgreeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: name || email, email, password });
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
        <p className="text-body-md text-on-surface-variant">{t('registerTagline')}</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="name">
            {t('displayName').toUpperCase()}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          />
        </div>

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
          <label className="font-label-caps text-on-surface-variant" htmlFor="password">
            {t('password').toUpperCase()}
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
          <p className="text-body-sm text-on-surface-variant">{t('passwordHint')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="confirm">
            {t('passwordConfirm').toUpperCase()}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-body-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
          />
          <span>
            {t.rich('termsCheckbox', {
              terms: (chunks: ReactNode) => (
                <a href="#" className="text-primary hover:underline">
                  {chunks}
                </a>
              ),
              privacy: (chunks: ReactNode) => (
                <a href="#" className="text-primary hover:underline">
                  {chunks}
                </a>
              ),
            })}
          </span>
        </label>

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
          {submitting ? t('submittingRegister') : t('submitRegister')}
        </button>
      </form>

      <p className="mt-6 text-center text-on-surface-variant">
        {t('loginCta')}
        <Link
          href={`/dang-nhap${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-primary hover:underline"
        >
          {t('loginLinkLabel')}
        </Link>
      </p>
    </div>
  );
}
