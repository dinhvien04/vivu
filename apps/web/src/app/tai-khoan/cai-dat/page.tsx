'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  AuthError,
  changePassword as apiChangePassword,
  deleteAccount as apiDeleteAccount,
  updateProfile as apiUpdateProfile,
} from '@/lib/auth-client';

type Section = 'tai-khoan' | 'mat-khau' | 'thong-bao' | 'rieng-tu';

const SECTIONS: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'tai-khoan', label: 'Tài khoản', icon: 'person' },
  { id: 'mat-khau', label: 'Bảo mật', icon: 'lock' },
  { id: 'thong-bao', label: 'Thông báo', icon: 'notifications' },
  { id: 'rieng-tu', label: 'Quyền riêng tư', icon: 'shield' },
];

export default function CaiDatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState<Section>('tai-khoan');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/dang-nhap?next=/tai-khoan/cai-dat');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <div className="h-72 animate-pulse rounded-2xl bg-surface-container" />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside>
            <h2 className="mb-1 font-h3 text-h3 text-primary">Cài đặt</h2>
            <p className="mb-6 text-body-md text-on-surface-variant">{user.email}</p>
            <nav aria-label="Mục cài đặt" className="flex flex-col gap-1">
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-secondary-container font-semibold text-on-secondary-container'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <Icon name={s.icon} size={20} />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-8">
            <h1 className="font-h1 text-h1 text-on-surface">
              {SECTIONS.find((s) => s.id === section)?.label}
            </h1>

            {section === 'tai-khoan' && <ProfileSection />}
            {section === 'mat-khau' && <SecuritySection />}
            {section === 'thong-bao' && <NotificationsSection />}
            {section === 'rieng-tu' && <PrivacySection />}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
  tone,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <section
      className={`rounded-2xl border bg-surface-container-lowest p-6 shadow-sm md:p-8 ${
        tone === 'danger'
          ? 'border-t-4 border-error/20 border-x-outline-variant border-b-outline-variant'
          : 'border-outline-variant'
      }`}
    >
      <h3 className="font-h3 text-h3 text-on-surface">{title}</h3>
      {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProfileSection() {
  const { user, getAccessToken, reloadUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setBio(user.bio ?? '');
    setLocation(user.location ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = await getAccessToken();
    if (!token) {
      setError('Phiên đã hết hạn. Đăng nhập lại để tiếp tục.');
      return;
    }
    setSaving(true);
    try {
      await apiUpdateProfile(token, {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      await reloadUser();
      setSuccess('Đã lưu thay đổi.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionCard title="Thông tin cơ bản" description="Cách bạn xuất hiện với cộng đồng Vivu.">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Email" hint="Email không thay đổi được trong phiên bản này.">
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant"
            />
          </Field>
          <Field label="Họ và tên">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Địa điểm" className="md:col-span-1">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              placeholder="Hà Nội, Việt Nam"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Ảnh đại diện (URL)" className="md:col-span-1">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              maxLength={500}
              placeholder="https://res.cloudinary.com/.../avatar.jpg"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Giới thiệu" className="md:col-span-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Vài dòng về sở thích du lịch, vùng miền yêu thích…"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-body-sm text-on-surface-variant">{bio.length}/500</p>
          </Field>

          {error && (
            <div
              role="alert"
              className="md:col-span-2 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="md:col-span-2 rounded-lg border border-primary/30 bg-primary-fixed px-4 py-3 text-body-md text-on-primary-fixed"
            >
              {success}
            </div>
          )}

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Tài khoản liên kết"
        description="Liên kết với các tài khoản bên ngoài để đăng nhập nhanh hơn (sắp ra mắt)."
      >
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <Icon name="account_circle" size={28} className="text-on-surface-variant" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">Google</p>
              <p className="text-body-sm text-on-surface-variant">Chưa liên kết</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="font-semibold text-on-surface-variant disabled:opacity-50"
          >
            Sắp ra mắt
          </button>
        </div>
      </SectionCard>
    </>
  );
}

function SecuritySection() {
  const { getAccessToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirm) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự.');
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setError('Phiên đã hết hạn. Đăng nhập lại để tiếp tục.');
      return;
    }
    setBusy(true);
    try {
      await apiChangePassword(token, currentPassword, newPassword);
      setSuccess('Đã đổi mật khẩu. Phiên đăng nhập khác đã bị thu hồi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Đổi mật khẩu thất bại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Đổi mật khẩu"
        description="Sau khi đổi, các thiết bị khác sẽ phải đăng nhập lại."
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Mật khẩu hiện tại">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự, có chữ và số.">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Nhập lại mật khẩu mới">
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="rounded-lg border border-primary/30 bg-primary-fixed px-4 py-3 text-body-md text-on-primary-fixed"
            >
              {success}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {busy ? 'Đang xử lý…' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Xác thực hai bước (2FA)"
        description="Bảo vệ tài khoản bằng mã OTP — sắp ra mắt."
      >
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div>
            <p className="font-semibold text-on-surface">Tắt</p>
            <p className="text-body-sm text-on-surface-variant">
              Khi bật, bạn cần nhập mã OTP mỗi lần đăng nhập trên thiết bị mới.
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-pressed="false"
            className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
          >
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
          </button>
        </div>
      </SectionCard>

      <DangerZone />
    </>
  );
}

function DangerZone() {
  const { getAccessToken, logout } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirmDelete(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const token = await getAccessToken();
    if (!token) {
      setError('Phiên đã hết hạn. Đăng nhập lại để tiếp tục.');
      return;
    }
    setBusy(true);
    try {
      await apiDeleteAccount(token, password);
      await logout();
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Xoá tài khoản thất bại');
      setBusy(false);
    }
  }

  return (
    <SectionCard
      tone="danger"
      title="Quản lý dữ liệu"
      description="Xuất bản sao dữ liệu hoặc xoá vĩnh viễn tài khoản. Hành động này không thể hoàn tác."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          disabled
          className="flex flex-col items-start gap-1 rounded-xl border border-outline-variant px-6 py-4 text-left transition-all hover:bg-surface-container-high disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-on-surface">
            <Icon name="download" size={18} />
            Xuất dữ liệu của tôi
          </span>
          <span className="text-body-sm text-on-surface-variant">
            Sắp ra mắt — gửi qua email dưới dạng JSON.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setConfirming((v) => !v)}
          className="flex flex-col items-start gap-1 rounded-xl border border-error/30 px-6 py-4 text-left transition-all hover:bg-error/5"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-error">
            <Icon name="delete_forever" size={18} />
            Xoá tài khoản
          </span>
          <span className="text-body-sm text-on-surface-variant">
            Xoá vĩnh viễn tài khoản, đánh giá, sổ tay, yêu thích.
          </span>
        </button>
      </div>

      {confirming && (
        <form
          className="mt-6 space-y-4 rounded-xl border border-error/30 bg-error/5 p-6"
          onSubmit={onConfirmDelete}
        >
          <p className="text-body-md text-on-surface">
            Nhập mật khẩu để xác nhận xoá tài khoản.{' '}
            <strong>Hành động này không thể hoàn tác.</strong>
          </p>
          <Field label="Mật khẩu">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-error focus:outline-none"
            />
          </Field>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPassword('');
                setError(null);
              }}
              className="rounded-lg border border-outline-variant px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error px-6 py-3 font-semibold text-on-error transition-all hover:bg-error/90 disabled:opacity-50"
            >
              {busy ? 'Đang xoá…' : 'Xác nhận xoá tài khoản'}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

function NotificationsSection() {
  return (
    <SectionCard
      title="Thông báo"
      description="Lựa chọn email và thông báo trong ứng dụng — sắp ra mắt."
    >
      <ul className="space-y-3">
        {[
          { label: 'Thông báo địa điểm mới gần bạn', desc: 'Email hàng tuần.' },
          { label: 'Trả lời cho câu hỏi/đánh giá của bạn', desc: 'Trong ứng dụng + email.' },
          { label: 'Bản tin Vivu', desc: 'Mẹo du lịch hàng tháng.' },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
          >
            <div>
              <p className="font-semibold text-on-surface">{row.label}</p>
              <p className="text-body-sm text-on-surface-variant">{row.desc}</p>
            </div>
            <button
              type="button"
              disabled
              className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
              aria-pressed="false"
            >
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function PrivacySection() {
  return (
    <SectionCard
      title="Quyền riêng tư"
      description="Kiểm soát ai xem được hồ sơ và hoạt động của bạn — sắp ra mắt."
    >
      <ul className="space-y-3">
        {[
          { label: 'Hồ sơ công khai', desc: 'Cho phép người khác xem trang cá nhân.' },
          {
            label: 'Hiển thị sổ tay công khai',
            desc: 'Sổ tay đánh dấu công khai sẽ hiển thị trên hồ sơ.',
          },
          {
            label: 'Cho phép tag tên',
            desc: 'Người khác có thể nhắc tên bạn trong câu hỏi/đánh giá.',
          },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
          >
            <div>
              <p className="font-semibold text-on-surface">{row.label}</p>
              <p className="text-body-sm text-on-surface-variant">{row.desc}</p>
            </div>
            <button
              type="button"
              disabled
              className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
              aria-pressed="false"
            >
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/dang-nhap"
          className="inline-flex items-center gap-2 text-body-md font-semibold text-error hover:underline"
        >
          <Icon name="logout" size={18} />
          Đăng xuất khỏi tất cả thiết bị
        </Link>
      </div>
    </SectionCard>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ''}`}>
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
      {hint && <span className="text-body-sm text-on-surface-variant">{hint}</span>}
    </label>
  );
}
