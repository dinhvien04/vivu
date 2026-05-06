import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { listPlaces } from '@/lib/api';
import { transformCloudinary } from '@/lib/image';

export const metadata = { title: 'Khám phá' };

const REGION_TABS = [
  { slug: '', label: 'Tất cả' },
  { slug: 'mien-bac', label: 'Miền Bắc' },
  { slug: 'mien-trung', label: 'Miền Trung' },
  { slug: 'tay-nguyen', label: 'Tây Nguyên' },
  { slug: 'mien-nam', label: 'Miền Nam' },
];

interface PageProps {
  searchParams?: { region?: string; q?: string };
}

export default async function KhamPhaPage({ searchParams }: PageProps) {
  const region = searchParams?.region;
  const q = searchParams?.q;

  let result: Awaited<ReturnType<typeof listPlaces>> | null = null;
  let error: string | null = null;
  try {
    result = await listPlaces({ region, q, pageSize: 50 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 max-w-3xl">
          <p className="text-overline uppercase tracking-overline text-secondary">Khám phá</p>
          <h1 className="mt-2 font-h1 text-h1 text-on-surface">Địa điểm du lịch Việt Nam</h1>
          <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
            Tra cứu các điểm đến nổi bật từ Bắc vào Nam — núi rừng Tây Bắc, biển đảo miền Trung, di
            sản văn hoá và phố cổ trên khắp đất nước.
          </p>
        </header>

        {/* Region tabs */}
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
          {REGION_TABS.map((tab) => {
            const active = (region ?? '') === tab.slug;
            const href = tab.slug ? `/kham-pha?region=${tab.slug}` : '/kham-pha';
            return (
              <Link
                key={tab.slug || 'all'}
                href={href}
                className={
                  active
                    ? 'rounded-full bg-primary px-4 py-2 text-body-md font-semibold text-white'
                    : 'rounded-full bg-surface-container px-4 py-2 text-body-md font-medium text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-on-secondary-container'
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {error && (
          <div className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            Không thể tải danh sách địa điểm. ({error})
          </div>
        )}

        {result && result.data.length === 0 && (
          <div className="rounded-lg bg-surface-container p-6 text-body-md text-on-surface-variant">
            Chưa có địa điểm nào trong nhóm này. Quay lại{' '}
            <Link href="/kham-pha" className="text-primary underline">
              tất cả
            </Link>
            .
          </div>
        )}

        {result && result.data.length > 0 && (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              Tổng cộng {result.meta.total} địa điểm
            </p>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.map((place) => (
                <li key={place.id}>
                  <Link
                    href={`/dia-diem/${place.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-video bg-surface-container">
                      {place.heroImageUrl ? (
                        <Image
                          src={
                            transformCloudinary(place.heroImageUrl, { width: 800, height: 450 }) ??
                            place.heroImageUrl
                          }
                          alt={place.titleVi}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-outline">
                          <Icon name="image" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-overline uppercase tracking-overline text-secondary">
                        {place.region?.nameVi ?? '—'}
                      </p>
                      <h3 className="mt-1 font-h4 text-h4 text-on-surface group-hover:text-primary">
                        {place.titleVi}
                      </h3>
                      {place.summaryVi && (
                        <p className="mt-2 line-clamp-3 text-body-sm text-on-surface-variant">
                          {place.summaryVi}
                        </p>
                      )}
                      {place.categories && place.categories.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1">
                          {place.categories.slice(0, 3).map((c) => (
                            <li
                              key={c.id}
                              className="rounded-full bg-secondary-container px-2 py-0.5 text-body-sm text-on-secondary-container"
                            >
                              {c.nameVi}
                            </li>
                          ))}
                        </ul>
                      )}
                      {place.address && (
                        <p className="mt-auto pt-3 text-body-sm text-outline">
                          <Icon name="location_on" className="mr-1 align-middle text-base" />
                          {place.address}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
