'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';

type AuthMode = 'login' | 'register';

interface AuthShellProps {
  mode: AuthMode;
  children: ReactNode;
}

const MODE_COPY = {
  login: {
    eyebrow: 'authShellLoginEyebrow',
    title: 'authShellLoginTitle',
    subtitle: 'authShellLoginSubtitle',
    benefits: [
      ['route', 'authShellLoginBenefitOne'],
      ['collections_bookmark', 'authShellLoginBenefitTwo'],
      ['support_agent', 'authShellLoginBenefitThree'],
    ],
    kicker: 'authShellLoginKicker',
  },
  register: {
    eyebrow: 'authShellRegisterEyebrow',
    title: 'authShellRegisterTitle',
    subtitle: 'authShellRegisterSubtitle',
    benefits: [
      ['explore', 'authShellRegisterBenefitOne'],
      ['bookmark_add', 'authShellRegisterBenefitTwo'],
      ['forum', 'authShellRegisterBenefitThree'],
    ],
    kicker: 'authShellRegisterKicker',
  },
} as const;

export function AuthShell({ mode, children }: AuthShellProps) {
  const t = useTranslations('auth');
  const copy = MODE_COPY[mode];

  return (
    <section
      aria-labelledby="auth-shell-title"
      data-testid="auth-shell"
      className="grid w-full max-w-6xl overflow-hidden rounded border border-outline-variant/40 bg-surface-container-lowest shadow-[0_24px_70px_-42px_rgba(15,30,55,0.45)] lg:grid-cols-[0.92fr_1.08fr]"
    >
      <aside className="relative min-w-0 overflow-hidden bg-[#123456] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,78,159,0.96),rgba(0,116,104,0.92)_56%,rgba(218,156,48,0.9))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:32px_32px]"
        />

        <div className="relative flex h-full min-h-[280px] flex-col justify-between gap-10 p-6 sm:p-8 lg:min-h-[640px] lg:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-white/95 shadow-card">
              <Image src="/vivu-logo.png" alt="" width={32} height={32} aria-hidden="true" />
            </span>
            <div>
              <p className="font-h3 text-h4 font-bold text-white">Vivu</p>
              <p className="text-body-sm text-white/78">{t('authShellBrandLine')}</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 font-label-caps text-white/75">{t(copy.eyebrow)}</p>
            <h1
              id="auth-shell-title"
              className="font-h1 text-[34px] font-bold leading-[1.16] text-white sm:text-[42px] lg:text-[46px]"
            >
              {t(copy.title)}
            </h1>
            <p className="mt-5 max-w-lg text-body-lg text-white/82">{t(copy.subtitle)}</p>
          </div>

          <div data-testid="auth-benefits" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {copy.benefits.map(([icon, key]) => (
              <div
                key={key}
                data-testid="auth-benefit"
                className="flex min-h-14 items-center gap-3 rounded border border-white/16 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/16">
                  <Icon name={icon} size={20} />
                </span>
                <span className="text-body-sm font-semibold text-white">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col bg-surface-container-lowest p-5 sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-body-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
          >
            <Icon name="arrow_back" size={18} />
            {t('authShellHomeLink')}
          </Link>
          <span className="rounded bg-primary-fixed px-3 py-2 font-label-caps text-on-primary-fixed">
            {t(copy.kicker)}
          </span>
        </div>

        <div
          data-testid="auth-form-panel"
          className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function ClerkAuthLoading() {
  const t = useTranslations('auth');

  return (
    <div
      data-testid="clerk-auth-loading"
      role="status"
      aria-live="polite"
      className="space-y-4 rounded border border-outline-variant/30 bg-surface-container-lowest p-1"
    >
      <span className="sr-only">{t('authShellLoading')}</span>
      <div className="h-12 animate-pulse rounded bg-surface-container-low" />
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-container" />
        <div className="h-12 animate-pulse rounded bg-surface-container-low" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        <div className="h-12 animate-pulse rounded bg-surface-container-low" />
      </div>
      <div className="h-12 animate-pulse rounded bg-primary-fixed" />
    </div>
  );
}
