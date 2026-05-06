/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Icon } from './icon';

const NAV_ITEMS = [
  { label: 'Khám phá', href: '/', active: true },
  { label: 'Điểm đến', href: '/diem-den' },
  { label: 'Lưu trú', href: '/luu-tru' },
  { label: 'Cẩm nang', href: '/cam-nang' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 shadow-sm backdrop-blur-md">
      <nav className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile py-unit md:px-margin-desktop">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-on-primary"
            >
              <span className="font-display text-lg font-extrabold tracking-tight">V</span>
            </span>
            <span className="font-display text-h3 font-bold tracking-tight text-primary">Vivu</span>
          </Link>
          <ul className="hidden items-center gap-8 text-body-md md:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={
                    item.active
                      ? 'border-b-2 border-primary pb-1 font-semibold text-primary'
                      : 'font-medium text-on-surface-variant transition-colors hover:text-primary'
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-6">
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
