'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { Icon } from '../../../components/icon';
import { AuthError } from '../../../lib/auth-client';

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterCardSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterCardSkeleton() {
  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="h-96 animate-pulse rounded-xl bg-surface-container-low" />
    </div>
  );
}

function RegisterForm() {
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
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agree) {
      setError('Vui lòng đồng ý với Điều khoản và Chính sách bảo mật');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password });
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
    <div className="w-full max-w-[480px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-8 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <h1 className="mt-4 font-h3 text-h3 text-on-surface">Tạo tài khoản mới</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Bắt đầu hành trình khám phá Việt Nam của bạn
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="name">
            HỌ VÀ TÊN
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>

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
            placeholder="example@gmail.com"
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="password">
            MẬT KHẨU
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
          />
          <p className="text-body-sm text-on-surface-variant/80">
            Tối thiểu 8 ký tự, có cả chữ và số.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-caps text-on-surface-variant" htmlFor="confirm-password">
            XÁC NHẬN MẬT KHẨU
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
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-body-md outline-none transition-all placeholder:text-outline/50 focus:bg-white focus:ring-2 focus:ring-primary"
          />
        </div>

        <label
          htmlFor="terms"
          className="flex cursor-pointer items-start gap-3 text-body-md text-on-surface-variant"
        >
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-outline-variant text-primary focus:ring-primary"
          />
          <span>
            Tôi đồng ý với{' '}
            <a className="font-semibold text-primary hover:underline" href="#">
              Điều khoản
            </a>{' '}
            và{' '}
            <a className="font-semibold text-primary hover:underline" href="#">
              Chính sách bảo mật
            </a>
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
          className="mt-2 w-full rounded-lg bg-primary py-4 font-h3 text-body-md font-bold text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </button>
      </form>

      <p className="mt-8 text-center text-body-md text-on-surface-variant">
        Đã có tài khoản?{' '}
        <Link
          href={`/dang-nhap${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-primary hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
