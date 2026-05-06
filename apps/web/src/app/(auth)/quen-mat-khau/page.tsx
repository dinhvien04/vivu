'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Icon } from '../../../components/icon';
import { AuthError, forgotPassword } from '../../../lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_24px_60px_-32px_rgba(15,30,55,0.35)] md:p-12">
      <div className="mb-8 text-center">
        <span className="font-h1 text-h1 font-bold tracking-tight text-primary">Vivu</span>
        <h1 className="mt-4 font-h3 text-h3 text-on-surface">Quên mật khẩu?</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu.
        </p>
      </div>

      {done ? (
        <div className="rounded-lg bg-primary-fixed p-5 text-center text-on-primary-fixed">
          <Icon name="mark_email_read" size={36} className="mx-auto mb-2 text-primary" />
          <p className="text-body-md font-semibold">
            Nếu email <span className="text-primary">{email}</span> tồn tại trong hệ thống, bạn sẽ
            nhận được liên kết đặt lại mật khẩu trong vài phút.
          </p>
          <p className="mt-3 text-body-sm text-on-surface-variant">
            Lưu ý: hiện tại email chưa được gửi thật — token đang được log ở console của API. Tính
            năng email sẽ bật khi cấu hình SMTP/Resend.
          </p>
          <Link
            href="/dang-nhap"
            className="mt-4 inline-block font-semibold text-primary hover:underline"
          >
            ← Quay lại Đăng nhập
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="ml-1 font-label-caps text-on-secondary-fixed-variant" htmlFor="email">
              EMAIL
            </label>
            <div className="relative">
              <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-lg border-none bg-surface-container-low py-4 pl-12 pr-4 text-body-md outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </div>
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
            className="mt-2 w-full rounded-lg bg-primary-container py-4 font-h3 text-body-lg text-on-primary shadow-lg shadow-primary-container/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang gửi…' : 'Gửi liên kết khôi phục'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-body-md text-on-surface-variant">
        Đã nhớ mật khẩu?{' '}
        <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
