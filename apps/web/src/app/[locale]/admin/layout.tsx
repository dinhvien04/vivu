import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminGuard } from '@/components/admin-guard';
import { Icon } from '@/components/icon';

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/admin', icon: 'dashboard' },
  { label: 'Địa điểm', href: '/admin/dia-diem', icon: 'place' },
  { label: 'Đánh giá', href: '/admin/danh-gia', icon: 'reviews' },
];

export const metadata = {
  title: { template: '%s · Vivu Admin', default: 'Vivu Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container/40">
      <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2 text-h4 font-h4 text-primary">
              <Icon name="admin_panel_settings" />
              <span>Vivu Admin</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                >
                  <Icon name={item.icon} className="text-base" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-primary md:flex"
            >
              <Icon name="logout" className="text-base" />
              Thoát admin
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="person" />
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-outline-variant/30 px-margin-mobile py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-body-sm font-medium text-on-surface-variant"
            >
              <Icon name={item.icon} className="text-base" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-container-max flex-1 px-margin-mobile py-8 md:px-margin-desktop">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
