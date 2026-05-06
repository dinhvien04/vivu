import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';

export const metadata = { title: 'Kiểm duyệt đánh giá' };

interface MockReview {
  id: string;
  author: { name: string; initials: string };
  placeTitle: string;
  rating: number;
  body: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reportCount: number;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1',
    author: { name: 'Trần Anh', initials: 'TA' },
    placeTitle: 'Phố cổ Hội An',
    rating: 5,
    body: 'Phố cổ rất đẹp, đèn lồng buổi tối lung linh. Đồ ăn ngon, người dân thân thiện. Sẽ quay lại!',
    createdAt: '2 giờ trước',
    status: 'pending',
    reportCount: 0,
  },
  {
    id: 'r2',
    author: { name: 'Minh Nguyễn', initials: 'MN' },
    placeTitle: 'Vịnh Hạ Long',
    rating: 4,
    body: 'Cảnh đẹp ngoài sức tưởng tượng. Tour 2 ngày 1 đêm trên du thuyền rất đáng tiền. Chỉ tiếc thời tiết hơi mưa.',
    createdAt: '5 giờ trước',
    status: 'pending',
    reportCount: 0,
  },
  {
    id: 'r3',
    author: { name: 'User-anonymous', initials: 'A' },
    placeTitle: 'Đà Lạt',
    rating: 1,
    body: 'Nội dung tục tĩu, quảng cáo tour của bên cạnh tranh.',
    createdAt: '1 ngày trước',
    status: 'pending',
    reportCount: 3,
  },
];

const TABS: { key: 'pending' | 'approved' | 'rejected'; label: string; count: number }[] = [
  {
    key: 'pending',
    label: 'Chờ duyệt',
    count: MOCK_REVIEWS.filter((r) => r.status === 'pending').length,
  },
  { key: 'approved', label: 'Đã duyệt', count: 0 },
  { key: 'rejected', label: 'Đã từ chối', count: 0 },
];

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name={i < value ? 'star' : 'star_border'} className="!text-base" />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const pending = MOCK_REVIEWS.filter((r) => r.status === 'pending');

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">
            Hệ thống quản trị
          </p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">Kiểm duyệt đánh giá</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            Phê duyệt hoặc từ chối đánh giá do người dùng gửi. Đánh giá có cờ báo cáo sẽ được ưu
            tiên hiển thị đầu danh sách.
          </p>
        </div>
      </header>

      <div className="mb-6 rounded-lg border border-tertiary/30 bg-tertiary-container/40 px-4 py-3 text-body-sm text-on-tertiary-container">
        <Icon name="info" className="mr-1 align-middle text-base" />
        Đây là dữ liệu mẫu. Đánh giá thật sẽ kết nối khi tính năng &quot;Cộng đồng&quot; được triển
        khai.
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-outline-variant pb-2">
        {TABS.map((tab) => {
          const active = tab.key === 'pending';
          return (
            <button
              key={tab.key}
              type="button"
              disabled={!active}
              className={
                active
                  ? 'rounded-full bg-primary px-4 py-1.5 text-body-sm font-semibold text-white'
                  : 'rounded-full bg-surface-container px-4 py-1.5 text-body-sm font-medium text-on-surface-variant disabled:cursor-not-allowed'
              }
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </nav>

      {pending.length === 0 ? (
        <EmptyState
          icon="task_alt"
          title="Đã xử lý hết!"
          description="Không có đánh giá nào đang chờ duyệt. Hãy quay lại sau khi có đánh giá mới từ người dùng."
        />
      ) : (
        <ul className="space-y-4">
          {pending.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm"
            >
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
                    {r.author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{r.author.name}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Đánh giá <span className="font-semibold text-primary">{r.placeTitle}</span> ·{' '}
                      {r.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StarRow value={r.rating} />
                  {r.reportCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-0.5 text-body-sm text-on-error-container">
                      <Icon name="flag" className="!text-sm" />
                      {r.reportCount} báo cáo
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-body-md text-on-surface">{r.body}</p>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/30 pt-4">
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-body-sm font-medium text-on-surface-variant"
                  title="Sẽ kích hoạt khi có Auth admin"
                >
                  <Icon name="visibility" className="!text-sm" />
                  Xem địa điểm
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-error/40 bg-error-container/40 px-3 py-1.5 text-body-sm font-semibold text-on-error-container"
                >
                  <Icon name="close" className="!text-sm" />
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-primary/60 px-3 py-1.5 text-body-sm font-semibold text-white"
                >
                  <Icon name="check" className="!text-sm" />
                  Duyệt
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
