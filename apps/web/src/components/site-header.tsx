'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HeaderAccount } from './header-account';
import { Icon } from './icon';

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khám phá', href: '/kham-pha' },
  { label: 'Hỏi đáp', href: '/hoi-dap' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close drawer on route change.
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-surface/90 shadow-sm backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile py-unit md:px-margin-desktop">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center" aria-label="Vivu">
              <Image
                src="/vivu-logo.png"
                alt="Vivu"
                width={708}
                height={274}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <ul className="hidden items-center gap-8 text-body-md md:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={
                        active
                          ? 'border-b-2 border-primary pb-1 font-semibold text-primary'
                          : 'font-medium text-on-surface-variant transition-colors hover:text-primary'
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {/* Desktop search input */}
            <div className="relative hidden lg:block">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                placeholder="Tìm kiếm địa danh..."
                className="w-64 rounded-full border-none bg-surface-container py-2 pl-10 pr-4 text-body-md transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Mobile/Tablet search button */}
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen((s) => !s)}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
            >
              <Icon name="search" />
            </button>

            <HeaderAccount />

            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Mở menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              onClick={() => setDrawerOpen(true)}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
            >
              <Icon name="menu" />
            </button>
          </div>
        </nav>

        {/* Mobile search row — slides down when active */}
        {searchOpen && (
          <div className="border-t border-outline-variant/30 px-margin-mobile py-3 lg:hidden">
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm địa danh..."
                className="w-full rounded-full border-none bg-surface-container py-2 pl-10 pr-4 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        id="mobile-drawer"
        className={`fixed right-0 top-0 z-[70] h-full w-72 max-w-[85%] transform bg-surface shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-20 items-center justify-between border-b border-outline-variant/30 px-margin-mobile">
          <Link href="/" className="flex items-center" aria-label="Vivu">
            <Image
              src="/vivu-logo.png"
              alt="Vivu"
              width={708}
              height={274}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setDrawerOpen(false)}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex flex-col gap-6 px-margin-mobile py-6">
          <ul className="space-y-1 text-body-lg">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
                      active
                        ? 'bg-primary-fixed font-semibold text-primary'
                        : 'font-medium text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {item.label}
                    <Icon name="chevron_right" className="text-outline" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-outline-variant/30 pt-4">
            <Link
              href="/dang-nhap"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              <Icon name="login" size={20} />
              Đăng nhập / Đăng ký
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
