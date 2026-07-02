'use client';

import { SignUp, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AuthShell, ClerkAuthLoading } from '@/components/auth-shell';
import { useAuth as useVivuAuth } from '@/components/auth-provider';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { Icon } from '@/components/icon';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { Link, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { AuthError } from '@/lib/auth-client';
import { getLocalizedAuthRedirect, getSafeAuthRedirect } from '@/lib/auth-redirect';
import { vivuClerkAppearance } from '@/lib/clerk-appearance';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterCardSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterCardSkeleton() {
  return (
    <div className="grid w-full max-w-6xl overflow-hidden rounded border border-outline-variant/40 bg-surface-container-lowest shadow-[0_24px_70px_-42px_rgba(15,30,55,0.45)] lg:grid-cols-[0.92fr_1.08fr]">
      <div className="h-72 animate-pulse bg-primary-fixed lg:h-[640px]" />
      <div className="flex min-h-[460px] items-center justify-center p-6 sm:p-10">
        <div className="h-96 w-full max-w-[430px] animate-pulse rounded bg-surface-container-low" />
      </div>
    </div>
  );
}

function RegisterForm() {
  const search = useSearchParams();
  const next = getSafeAuthRedirect(search?.get('next') ?? null, '/tai-khoan');
  return CLERK_ENABLED ? <ClerkRegisterCard next={next} /> : <LegacyRegisterForm next={next} />;
}

function ClerkRegisterCard({ next }: { next: string }) {
  const locale = useLocale();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { reloadUser } = useVivuAuth();
  const signUpPath = locale === routing.defaultLocale ? '/dang-ky' : `/${locale}/dang-ky`;
  const signInPath = locale === routing.defaultLocale ? '/dang-nhap' : `/${locale}/dang-nhap`;
  const redirectUrl = getLocalizedAuthRedirect(next, locale);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    void reloadUser();
    window.location.replace(redirectUrl);
  }, [clerkLoaded, isSignedIn, redirectUrl, reloadUser]);

  return (
    <AuthShell mode="register">
      <div data-testid="clerk-auth-widget" className="min-h-[420px]">
        {clerkLoaded ? (
          <SignUp
            routing="path"
            path={signUpPath}
            signInUrl={`${signInPath}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            appearance={vivuClerkAppearance}
          />
        ) : (
          <ClerkAuthLoading />
        )}
      </div>
    </AuthShell>
  );
}

function LegacyRegisterForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const { register } = useVivuAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
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
      await register({ name: name || email, email, password, turnstileToken });
      router.replace(next);
      router.refresh();
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/75 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/75 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/75 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/75 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
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
                <Link href="/dieu-khoan-su-dung" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks: ReactNode) => (
                <Link href="/chinh-sach-bao-mat" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

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
          {submitting ? t('submittingRegister') : t('submitRegister')}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-grow border-t border-outline-variant" />
        <span className="mx-4 bg-surface-container-lowest px-2 font-label-caps text-outline">
          {t('or').toUpperCase()}
        </span>
        <div className="h-px flex-grow border-t border-outline-variant" />
      </div>

      <GoogleAuthButton mode="register" />

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
