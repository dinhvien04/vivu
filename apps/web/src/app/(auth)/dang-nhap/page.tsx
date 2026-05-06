'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { Icon } from '../../../components/icon';
import { AuthError } from '../../../lib/auth-client';

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
      const msg = err instanceof AuthError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <p className="text-body-md text-on-surface-variant">Khám phá vẻ đẹp Việt Nam</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="email">
            EMAIL
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-label-caps text-on-surface-variant" htmlFor="password">
              MẬT KHẨU
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-[14px] text-primary transition-all hover:underline"
            >
              Quên mật khẩu?
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
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
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="h-px flex-grow border-t border-outline-variant" />
        <span className="mx-4 bg-surface-container-lowest px-2 font-label-caps text-outline">
          HOẶC
        </span>
        <div className="h-px flex-grow border-t border-outline-variant" />
      </div>

      <button
        type="button"
        disabled
        title="Sắp ra mắt"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-outline-variant px-4 py-3 transition-all hover:bg-surface-container-low active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="font-body-md font-semibold text-on-surface">Đăng nhập với Google</span>
      </button>

      <p className="mt-6 text-center text-on-surface-variant">
        Chưa có tài khoản?{' '}
        <Link
          href={`/dang-ky${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-primary hover:underline"
        >
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
