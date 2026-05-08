'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { fetchStats, type AuthStats } from '@/lib/auth-client';

function formatJoinDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'V';
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || trimmed[0]!.toUpperCase();
}

export default function TaiKhoanPage() {
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [stats, setStats] = useState<AuthStats | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/dang-nhap?next=/tai-khoan');
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const s = await fetchStats(token);
      if (!cancelled && s) setStats(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, getAccessToken]);

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

  const initials = getInitials(user.name);
  const joinedAt = formatJoinDate(user.createdAt);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-section-gap">
        <section className="mb-10 rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-highest bg-primary text-h2 font-bold text-on-primary md:h-40 md:w-40">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <Link
                href="/tai-khoan/cai-dat"
                aria-label="Chỉnh sửa hồ sơ"
                className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform hover:scale-105"
              >
                <Icon name="edit" size={18} />
              </Link>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-h1 text-h2 text-on-surface">{user.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-sans text-body-md text-on-surface-variant md:justify-start">
                {user.location && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="location_on" size={18} />
                    {user.location}
                  </span>
                )}
                {joinedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="calendar_month" size={18} />
                    Tham gia từ {joinedAt}
                  </span>
                )}
              </div>
              {user.bio ? (
                <p className="mt-4 max-w-2xl whitespace-pre-line font-sans text-body-md text-on-surface-variant">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-4 max-w-2xl font-sans text-body-md italic text-outline">
                  Bạn chưa thêm phần giới thiệu — chia sẻ một chút về sở thích du lịch của bạn.
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/tai-khoan/cai-dat"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-label-caps text-label-caps text-on-primary shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                >
                  <Icon name="edit" size={18} />
                  CHỈNH SỬA HỒ SƠ
                </Link>
                <Link
                  href="/tai-khoan/cai-dat"
                  aria-label="Cài đặt tài khoản"
                  className="inline-flex h-10 w-10 items-center justify-center self-center rounded-lg border border-outline text-on-surface-variant transition-colors hover:bg-surface-container-high sm:self-auto"
                >
                  <Icon name="settings" size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-section-gap grid grid-cols-1 gap-gutter md:grid-cols-3">
          <StatCard
            value={stats?.reviews}
            label="Đánh giá"
            icon="rate_review"
            accent="border-primary"
            href="/tai-khoan?tab=reviews"
          />
          <StatCard
            value={stats?.collections}
            label="Sổ tay"
            icon="collections_bookmark"
            accent="border-tertiary"
            href="/so-tay"
          />
          <StatCard
            value={stats?.favorites}
            label="Yêu thích"
            icon="favorite"
            accent="border-secondary-fixed-dim"
            href="/tai-khoan/yeu-thich"
          />
        </section>

        <section className="mb-section-gap">
          <h2 className="mb-6 flex items-center gap-2 font-h2 text-h3 text-on-surface">
            <Icon name="emoji_events" size={28} className="text-primary" />
            Thành tích
          </h2>
          <div className="flex flex-wrap gap-3">
            <Badge color="primary" icon="explore" label="Người tiên phong" />
            <Badge color="tertiary" icon="restaurant" label="Chuyên gia ẩm thực" />
            <Badge color="secondary" icon="auto_stories" label="Người kể chuyện" />
          </div>
        </section>

        <section>
          <nav
            aria-label="Hoạt động"
            className="mb-6 flex gap-2 overflow-x-auto border-b border-outline-variant"
          >
            <Link
              href="/tai-khoan?tab=reviews"
              className="border-b-2 border-primary px-6 py-3 font-label-caps text-label-caps font-bold text-primary"
            >
              ĐÁNH GIÁ
            </Link>
            <Link
              href="/so-tay"
              className="border-b-2 border-transparent px-6 py-3 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
            >
              SỔ TAY
            </Link>
            <Link
              href="/tai-khoan/yeu-thich"
              className="border-b-2 border-transparent px-6 py-3 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
            >
              YÊU THÍCH
            </Link>
          </nav>

          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 px-8 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="rate_review" className="!text-3xl" />
            </div>
            <h3 className="mb-2 font-h4 text-h4 text-on-surface">
              {stats && stats.reviews > 0
                ? `Bạn có ${stats.reviews} đánh giá`
                : 'Chưa có đánh giá nào'}
            </h3>
            <p className="mb-6 text-body-md text-on-surface-variant">
              {stats && stats.reviews > 0
                ? 'Quản lý các đánh giá đã đăng — tính năng đang được hoàn thiện.'
                : 'Hãy ghé một địa điểm yêu thích và để lại review đầu tiên của bạn.'}
            </p>
            <Link
              href="/kham-pha"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-on-primary transition-all hover:bg-primary/90 active:scale-95"
            >
              Khám phá địa điểm
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

interface StatCardProps {
  value: number | undefined;
  label: string;
  icon: string;
  accent: string;
  href: string;
}

function StatCard({ value, label, icon, accent, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`group rounded-lg border-b-4 ${accent} bg-surface-container-low p-6 text-center shadow-sm transition-transform duration-300 hover:scale-[1.02]`}
    >
      <Icon
        name={icon}
        size={28}
        className="mx-auto mb-2 block text-on-surface-variant transition-colors group-hover:text-primary"
      />
      <p className="font-h2 text-h2 font-bold text-on-surface">
        {value === undefined ? '—' : value}
      </p>
      <p className="mt-1 font-label-caps text-label-caps uppercase text-on-surface-variant">
        {label}
      </p>
    </Link>
  );
}

function Badge({
  color,
  icon,
  label,
}: {
  color: 'primary' | 'tertiary' | 'secondary';
  icon: string;
  label: string;
}) {
  const cls =
    color === 'primary'
      ? 'bg-primary-fixed text-on-primary-fixed'
      : color === 'tertiary'
        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
        : 'bg-secondary-fixed text-on-secondary-fixed';
  return (
    <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${cls}`}>
      <Icon name={icon} size={20} />
      <span className="text-body-md font-semibold">{label}</span>
    </div>
  );
}
