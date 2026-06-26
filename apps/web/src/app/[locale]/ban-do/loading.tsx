import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function MapLoadingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <div className="mb-6 max-w-3xl space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-surface-container" />
          <div className="h-12 w-64 animate-pulse rounded-xl bg-surface-container md:w-96" />
          <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-surface-container" />
        </div>
        <section className="h-[70vh] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container/50 p-4">
          <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-low" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
