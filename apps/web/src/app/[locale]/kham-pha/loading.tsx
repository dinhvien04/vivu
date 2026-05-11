import { PlaceCardSkeleton, Skeleton } from '@/components/skeleton';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <div className="mb-8 max-w-3xl space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
        <div className="mb-8 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="mb-4 h-4 w-32" />
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <PlaceCardSkeleton />
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
