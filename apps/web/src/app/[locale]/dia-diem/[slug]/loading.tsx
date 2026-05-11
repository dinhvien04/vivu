import { Skeleton } from '@/components/skeleton';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function PlaceDetailLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <Skeleton className="h-4 w-72" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-3/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="mt-8 aspect-[16/7] w-full rounded-xl" />
        <div className="mt-12 grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
