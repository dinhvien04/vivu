'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

const NAV_ITEMS = [
  { label: 'Khám phá', href: '/' },
  { label: 'Điểm đến', href: '/diem-den' },
  { label: 'Lưu trú', href: '/luu-tru' },
  { label: 'Cẩm nang', href: '/cam-nang' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '/kham-pha';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/';

  return (
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

        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Tìm kiếm địa danh..."
              className="w-64 rounded-full border-none bg-surface-container py-2 pl-10 pr-4 text-body-md transition-all focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            aria-label="Tài khoản"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="person" />
          </button>
        </div>
      </nav>
    </header>
  );
}
