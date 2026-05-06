import Link from 'next/link';
import { Icon } from '@/components/icon';
import { listPlaces } from '@/lib/api';

export const metadata = { title: 'Quản lý địa điểm' };

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

export default async function AdminPlacesList({ searchParams }: PageProps) {
  const region = searchParams?.region;
  const q = searchParams?.q;

  let result: Awaited<ReturnType<typeof listPlaces>> | null = null;
  let error: string | null = null;
  try {
    result = await listPlaces({ region, q, pageSize: 100 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">
            Hệ thống quản trị
          </p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">Quản lý địa điểm</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            Tra cứu, chỉnh sửa và xuất bản các địa điểm du lịch.
          </p>
        </div>
        <Link
          href="/admin/dia-diem/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
        >
          <Icon name="add" className="text-base" />
          Thêm địa điểm
        </Link>
      </header>

      <form action="/admin/dia-diem" className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm theo tên hoặc địa chỉ..."
            className="w-full rounded-full border border-outline-variant bg-surface py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary"
          />
        </div>
        {region && <input type="hidden" name="region" value={region} />}
        <button
          type="submit"
          className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-semibold text-on-surface hover:bg-surface-container"
        >
          Tìm
        </button>
      </form>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
        {REGION_TABS.map((tab) => {
          const active = (region ?? '') === tab.slug;
          const params = new URLSearchParams();
          if (tab.slug) params.set('region', tab.slug);
          if (q) params.set('q', q);
          const href = `/admin/dia-diem${params.toString() ? `?${params.toString()}` : ''}`;
          return (
            <Link
              key={tab.slug || 'all'}
              href={href}
              className={
                active
                  ? 'rounded-full bg-primary px-4 py-1.5 text-body-sm font-semibold text-white'
                  : 'rounded-full bg-surface-container px-4 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {error && (
        <div className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container">
          Không thể tải danh sách địa điểm. ({error})
        </div>
      )}

      {result && (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
          <table className="min-w-full divide-y divide-outline-variant/40">
            <thead className="bg-surface-container/40">
              <tr className="text-left text-overline uppercase tracking-overline text-on-surface-variant">
                <th className="px-4 py-3">Địa điểm</th>
                <th className="hidden px-4 py-3 md:table-cell">Vùng</th>
                <th className="hidden px-4 py-3 lg:table-cell">Chuyên mục</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-body-md">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                    Không có địa điểm khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                result.data.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-md bg-surface-container">
                          {p.heroImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.heroImageUrl}
                              alt={p.titleVi}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-on-surface">{p.titleVi}</p>
                          <p className="truncate text-body-sm text-on-surface-variant">
                            {p.address ?? 'Chưa có địa chỉ'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-body-sm text-on-surface-variant">
                        {p.region?.nameVi ?? '—'}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.categories ?? []).slice(0, 2).map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-secondary-container px-2 py-0.5 text-body-sm text-on-secondary-container"
                          >
                            {c.nameVi}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === 'published'
                            ? 'inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-body-sm text-on-secondary-container'
                            : 'inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-body-sm text-on-surface-variant'
                        }
                      >
                        <Icon
                          name={p.status === 'published' ? 'check_circle' : 'edit_note'}
                          className="!text-sm"
                        />
                        {p.status === 'published' ? 'Đã xuất bản' : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/dia-diem/${p.slug}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm font-semibold text-primary hover:bg-primary-container/40"
                      >
                        <Icon name="edit" className="!text-sm" />
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container/40 px-4 py-2 text-body-sm text-on-surface-variant">
            <span>{result.meta.total} địa điểm</span>
            <span>
              Trang {result.meta.page} /{' '}
              {Math.max(1, Math.ceil(result.meta.total / result.meta.pageSize))}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
