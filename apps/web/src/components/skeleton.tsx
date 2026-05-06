import type { HTMLAttributes } from 'react';

/**
 * Generic shimmer placeholder used while loading content.
 * Use Tailwind utilities to size, e.g. `<Skeleton className="h-4 w-32" />`.
 */
export function Skeleton({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-container ${className}`}
      aria-hidden="true"
      {...rest}
    />
  );
}

/**
 * Skeleton placeholder shaped like a Place card (ảnh + tiêu đề + summary + tags).
 * Used in the Khám phá / Tìm kiếm grids while data is loading.
 */
export function PlaceCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface">
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-auto flex gap-2 pt-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
