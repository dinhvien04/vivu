import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { getPlaceBySlug } from '@/lib/api';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  return { title: `Sửa: ${params.slug}` };
}

export default async function AdminPlaceEdit({ params }: PageProps) {
  let place: Awaited<ReturnType<typeof getPlaceBySlug>> | null = null;
  try {
    place = await getPlaceBySlug(params.slug);
  } catch {
    notFound();
  }

  if (!place) notFound();

  return (
    <>
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <nav
            aria-label="Đường dẫn"
            className="mb-2 flex items-center gap-1 text-overline uppercase tracking-overline text-on-surface-variant"
          >
            <Link href="/admin" className="hover:text-primary">
              Admin
            </Link>
            <Icon name="chevron_right" className="!text-sm" />
            <Link href="/admin/dia-diem" className="hover:text-primary">
              Quản lý
            </Link>
            <Icon name="chevron_right" className="!text-sm" />
            <span className="text-primary">Chỉnh sửa</span>
          </nav>
          <h1 className="font-h2 text-h2 text-on-surface">{place.titleVi}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Slug: <code className="rounded bg-surface-container px-1.5 py-0.5">{place.slug}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dia-diem"
            className="rounded-lg border border-outline-variant px-4 py-2 font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Hủy
          </Link>
          <button
            type="submit"
            form="place-edit-form"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-primary/60 px-4 py-2 font-semibold text-white"
            title="Chức năng lưu sẽ kích hoạt khi có Auth admin"
          >
            <Icon name="save" className="text-base" />
            Lưu thay đổi
          </button>
        </div>
      </header>

      <div className="mb-6 rounded-lg border border-tertiary/30 bg-tertiary-container/40 px-4 py-3 text-body-sm text-on-tertiary-container">
        <Icon name="info" className="mr-1 align-middle text-base" />
        Form đang ở chế độ chỉ xem. Chức năng lưu sẽ kích hoạt khi có hệ thống đăng nhập admin.
      </div>

      <form id="place-edit-form" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">Thông tin cơ bản</legend>
            <div className="space-y-4">
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Tên (tiếng Việt)
                </span>
                <input
                  type="text"
                  defaultValue={place.titleVi}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Tên (English)
                </span>
                <input
                  type="text"
                  defaultValue={place.titleEn ?? ''}
                  placeholder="Tên tiếng Anh (tuỳ chọn)"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Tóm tắt
                </span>
                <textarea
                  rows={3}
                  defaultValue={place.summaryVi ?? ''}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Địa chỉ
                </span>
                <input
                  type="text"
                  defaultValue={place.address ?? ''}
                  placeholder="Tỉnh, thành phố, địa danh..."
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">Mô tả chi tiết</legend>
            <textarea
              rows={12}
              defaultValue={place.descriptionVi ?? ''}
              placeholder="Viết mô tả chi tiết về địa điểm: lịch sử, đặc trưng, điểm nổi bật..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-sans text-body-md leading-relaxed focus:bg-white focus:ring-2 focus:ring-primary"
            />
            <p className="mt-2 text-body-sm text-outline">
              Hỗ trợ Markdown cơ bản (in đậm, in nghiêng, danh sách, link).
            </p>
          </fieldset>

          <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">
              Hình ảnh ({place.photos?.length ?? 0})
            </legend>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(place.photos ?? []).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-surface-container"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.alt ?? ''}
                    className="h-full w-full object-cover"
                  />
                  {photo.isCover && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-body-sm font-semibold text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                disabled
                className="flex aspect-square cursor-not-allowed items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container/30 text-outline"
                title="Sẽ kết nối Cloudinary upload sau"
              >
                <span className="flex flex-col items-center gap-1">
                  <Icon name="add_photo_alternate" className="!text-2xl" />
                  <span className="text-body-sm">Thêm ảnh</span>
                </span>
              </button>
            </div>
          </fieldset>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <h3 className="mb-4 font-h4 text-h4 text-on-surface">Trạng thái</h3>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Hiển thị
              </span>
              <select
                defaultValue={place.status}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <h3 className="mb-4 font-h4 text-h4 text-on-surface">Vị trí</h3>
            <label className="mb-4 block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Vùng
              </span>
              <input
                type="text"
                defaultValue={place.region?.nameVi ?? ''}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md text-on-surface-variant"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Vĩ độ
                </span>
                <input
                  type="number"
                  step="0.000001"
                  defaultValue={place.geo?.lat ?? ''}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                  Kinh độ
                </span>
                <input
                  type="number"
                  step="0.000001"
                  defaultValue={place.geo?.lng ?? ''}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
            <h3 className="mb-4 font-h4 text-h4 text-on-surface">Chuyên mục</h3>
            {place.categories && place.categories.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {place.categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full bg-secondary-container px-3 py-1 text-body-sm text-on-secondary-container"
                  >
                    {c.nameVi}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-variant">Chưa gắn chuyên mục.</p>
            )}
          </div>
        </aside>
      </form>
    </>
  );
}
