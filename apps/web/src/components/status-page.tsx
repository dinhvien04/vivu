import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './icon';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export interface StatusAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: string;
}

interface StatusPageProps {
  /** Primary heading. */
  title: string;
  /** Supporting paragraph. Plain text (line-breaks via `\n`). */
  description: string;
  /** Material Symbols icon name displayed above the title. */
  icon: string;
  /** Tone of the icon — controls bg + text colors. */
  tone?: 'info' | 'warning' | 'error' | 'success';
  /** Up to two CTAs. */
  actions?: StatusAction[];
  /** Optional small overline label, e.g. "404" or "BẢO TRÌ". */
  overline?: string;
  /** Optional content rendered below actions (e.g. status table for maintenance). */
  children?: ReactNode;
}

const TONE_STYLES: Record<NonNullable<StatusPageProps['tone']>, { bg: string; text: string }> = {
  info: { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  warning: { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  error: { bg: 'bg-error-container', text: 'text-on-error-container' },
  success: { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
};

function ActionButton({ a }: { a: StatusAction }) {
  const baseCls =
    'inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold transition-all active:scale-95';
  const cls =
    a.variant === 'secondary'
      ? `${baseCls} border-2 border-primary text-primary hover:bg-primary-container/40`
      : `${baseCls} bg-primary text-white hover:bg-primary/90`;

  const inner = (
    <>
      {a.icon && <Icon name={a.icon} className="text-base" />}
      {a.label}
    </>
  );

  if (a.href) {
    return (
      <Link href={a.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={a.onClick} className={cls}>
      {inner}
    </button>
  );
}

export function StatusPage({
  title,
  description,
  icon,
  tone = 'info',
  actions = [],
  overline,
  children,
}: StatusPageProps) {
  const t = TONE_STYLES[tone];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-container-max flex-col items-center justify-center px-margin-mobile py-section-gap text-center md:px-margin-desktop">
        <div
          className={`mb-8 flex h-24 w-24 items-center justify-center rounded-full ${t.bg} ${t.text}`}
        >
          <Icon name={icon} className="!text-5xl" />
        </div>
        {overline && (
          <p className="mb-3 text-overline uppercase tracking-overline text-secondary">
            {overline}
          </p>
        )}
        <h1 className="mb-4 max-w-2xl font-h1 text-h1 text-on-surface">{title}</h1>
        <p className="mb-10 max-w-xl whitespace-pre-line font-sans text-body-lg text-on-surface-variant">
          {description}
        </p>
        {actions.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {actions.map((a) => (
              <ActionButton key={a.label} a={a} />
            ))}
          </div>
        )}
        {children && <div className="mt-12 w-full max-w-2xl">{children}</div>}
      </main>
      <SiteFooter />
    </>
  );
}
