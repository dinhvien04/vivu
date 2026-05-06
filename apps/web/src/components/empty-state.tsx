import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  /** Compact variant uses smaller paddings, suitable for inline panels. */
  compact?: boolean;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 text-center ${
        compact ? 'px-6 py-8' : 'px-8 py-16'
      }`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name={icon} className="!text-3xl" />
      </div>
      <h3 className="mb-2 font-h4 text-h4 text-on-surface">{title}</h3>
      <p className="mb-6 max-w-md text-body-md text-on-surface-variant">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
          >
            {action.label}
          </button>
        ))}
      {children}
    </div>
  );
}
