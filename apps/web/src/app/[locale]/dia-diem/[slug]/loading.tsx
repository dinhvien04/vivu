import { Skeleton } from '@/components/skeleton';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function PlaceDetailLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-12 space-y-16">
        {/* Hero skeleton */}
        <Skeleton className="aspect-[16/9] sm:aspect-[16/7] md:aspect-[21/9] lg:aspect-[24/9] w-full rounded-2xl sm:rounded-[2rem]" />

        {/* Quick Info Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-6"
            >
              <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Two column layout skeleton */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Description card */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Map card */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 space-y-4">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-outline-variant/30 p-6 space-y-3 bg-surface-container-lowest">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
