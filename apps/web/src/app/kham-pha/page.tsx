import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata = { title: 'Khám phá' };

export default function KhamPhaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <h1 className="font-h1 text-h1 text-on-surface">Khám phá</h1>
        <p className="mt-4 max-w-2xl font-sans text-body-lg text-on-surface-variant">
          Trang khám phá sẽ liệt kê các chủ đề, vùng miền, và địa điểm nổi bật theo mùa.
        </p>
        <p className="mt-8 rounded-lg bg-surface-container p-4 text-body-md text-on-surface-variant">
          TODO: kết nối API <code className="font-mono text-primary">/api/v1/places</code> và hiển
          thị danh sách có filter, search.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
