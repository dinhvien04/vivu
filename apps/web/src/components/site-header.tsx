'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { HeaderAccount } from './header-account';
import { Icon } from './icon';
import { LocaleToggle } from './locale-toggle';
import { NotificationsButton } from './notifications-button';
import { SearchHero } from './search-hero';
import { ThemeToggle } from './theme-toggle';

type NavKey = 'home' | 'explore' | 'map' | 'tripPlanner' | 'consulting' | 'aiChat';

const NAV_ITEMS: {
  labelKey: NavKey;
  href: '/' | '/kham-pha' | '/ban-do' | '/lich-trinh' | '/tu-van' | '/ai-chat';
}[] = [
  { labelKey: 'home', href: '/' },
  { labelKey: 'explore', href: '/kham-pha' },
  { labelKey: 'map', href: '/ban-do' },
  { labelKey: 'tripPlanner', href: '/lich-trinh' },
  { labelKey: 'consulting', href: '/tu-van' },
  { labelKey: 'aiChat', href: '/ai-chat' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const t = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // The notifications bell is only relevant in authenticated surfaces; we
  // surface it on `/admin/*` and `/so-tay/*` to match the spec in PROGRESS.md.
  const showNotifications = useMemo(
    () => pathname.startsWith('/admin') || pathname.startsWith('/so-tay'),
    [pathname],
  );

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
        <nav className="mx-auto flex h-20 max-w-container-max items-center gap-4 px-margin-mobile py-unit md:px-margin-desktop">
          <div className="flex min-w-0 flex-1 items-center gap-6 xl:gap-10">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Vivu">
              <Image
                src="/vivu-logo.png"
                alt="Vivu"
                width={708}
                height={274}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <ul className="hidden min-w-0 flex-1 items-center gap-3 text-body-sm lg:flex xl:gap-5 xl:text-body-md">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const isConsulting = item.labelKey === 'consulting';
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className={`outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded ${
                        isConsulting
                          ? active
                            ? 'whitespace-nowrap rounded-full bg-primary px-3 py-2 font-semibold text-on-primary shadow-sm xl:px-4'
                            : 'whitespace-nowrap rounded-full border border-primary/40 bg-primary-fixed px-3 py-2 font-semibold text-primary transition-colors hover:bg-primary-fixed-dim xl:px-4'
                        : active
                          ? 'whitespace-nowrap border-b-2 border-primary pb-1 font-semibold text-primary'
                          : 'whitespace-nowrap font-medium text-on-surface-variant transition-colors hover:text-primary'
                      }`}
                    >
                      {t(`nav.${item.labelKey}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
            {/* Desktop search input */}
            <div className="hidden w-56 xl:block 2xl:w-64">
              <SearchHero compact placeholder={t('common.searchPlaceholder')} />
            </div>

            {/* Mobile/Tablet search button */}
            <button
              type="button"
              aria-label={t('common.search')}
              onClick={() => setSearchOpen((s) => !s)}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container xl:hidden"
            >
              <Icon name="search" />
            </button>

            {showNotifications && <NotificationsButton />}

            <ThemeToggle />
            <LocaleToggle />

            <HeaderAccount />

            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label={t('common.openMenu')}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              onClick={() => setDrawerOpen(true)}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
            >
              <Icon name="menu" />
            </button>
          </div>
        </nav>

        {/* Mobile search row — slides down when active */}
        {searchOpen && (
          <div className="border-t border-outline-variant/30 px-margin-mobile py-3 xl:hidden">
            <SearchHero compact placeholder={t('common.searchPlaceholder')} />
          </div>
        )}
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        id="mobile-drawer"
        className={`fixed right-0 top-0 z-[70] h-full w-72 max-w-[85%] transform bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
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
            aria-label={t('common.closeMenu')}
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
              const isConsulting = item.labelKey === 'consulting';
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
                      isConsulting && active
                        ? 'bg-primary font-semibold text-on-primary shadow-sm'
                        : isConsulting
                          ? 'border border-primary/40 bg-primary-fixed font-semibold text-primary hover:bg-primary-fixed-dim'
                      : active
                        ? 'bg-primary-fixed font-semibold text-primary'
                        : 'font-medium text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {t(`nav.${item.labelKey}`)}
                    <Icon name="chevron_right" className="text-outline" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2 border-t border-outline-variant/30 pt-4">
            <ThemeToggle />
            <LocaleToggle />
          </div>
          <div className="border-t border-outline-variant/30 pt-4">
            <Link
              href="/dang-nhap"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              <Icon name="login" size={20} />
              {t('common.signIn')} / {t('common.signUp')}
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
