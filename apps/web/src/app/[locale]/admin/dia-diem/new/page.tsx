import Link from 'next/link';
import { PlaceForm } from '@/components/admin/place-form';
import { Icon } from '@/components/icon';
import { listCategories, listRegions } from '@/lib/api';

export const metadata = { title: 'Thêm địa điểm' };

export default async function AdminPlaceNew() {
  const [regions, categories] = await Promise.all([
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/admin/dia-diem"
            className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
          >
            <Icon name="arrow_back" className="!text-base" />
            Danh sách địa điểm
          </Link>
          <h1 className="mt-2 font-h2 text-h2 text-on-surface">Thêm địa điểm mới</h1>
          <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">
            Mặc định lưu ở trạng thái <strong>bản nháp</strong>. Bạn có thể xuất bản sau khi kiểm
            tra lại nội dung.
          </p>
        </div>
      </header>
      <PlaceForm mode="create" regions={regions} categories={categories} />
    </>
  );
}
