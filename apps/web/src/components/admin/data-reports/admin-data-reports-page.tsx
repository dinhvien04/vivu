'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DataReport, DataReportStatus, DataReportType } from '@vivu/types';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import {
  listAdminDataReports,
  updateDataReportStatus,
  type ListDataReportsOptions,
} from '@/lib/admin-data-reports-client';

const STATUSES: Array<{ value: DataReportStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'reviewed', label: 'Đã xem' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'rejected', label: 'Từ chối' },
];

const TYPES: Array<{ value: DataReportType | ''; label: string }> = [
  { value: '', label: 'Tất cả loại lỗi' },
  { value: 'wrong_image', label: 'Sai hình ảnh' },
  { value: 'wrong_coordinates', label: 'Sai tọa độ' },
  { value: 'wrong_description', label: 'Sai mô tả' },
  { value: 'missing_info', label: 'Thiếu thông tin' },
  { value: 'other', label: 'Khác' },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClass(status: DataReportStatus): string {
  switch (status) {
    case 'new':
      return 'bg-primary-fixed text-primary';
    case 'reviewed':
      return 'bg-secondary-container text-on-secondary-container';
    case 'resolved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-error-container text-on-error-container';
  }
}

export function AdminDataReportsPage() {
  const { getAccessToken, user } = useAuth();
  const [rows, setRows] = useState<DataReport[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<DataReportStatus | ''>('new');
  const [type, setType] = useState<DataReportType | ''>('');
  const [placeSlug, setPlaceSlug] = useState('');
  const [selected, setSelected] = useState<DataReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const opts = useMemo<ListDataReportsOptions>(
    () => ({
      status,
      type,
      placeSlug: placeSlug.trim() || undefined,
      pageSize: 50,
    }),
    [placeSlug, status, type],
  );

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Thiếu access token.');
        const data = await listAdminDataReports(token, opts);
        if (!cancelled) {
          setRows(data.data);
          setTotal(data.meta.total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được báo lỗi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, opts, user]);

  const changeStatus = async (report: DataReport, nextStatus: DataReportStatus) => {
    const token = await getAccessToken();
    if (!token) return;
    setSavingId(report.id);
    try {
      const updated = await updateDataReportStatus(token, report.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === report.id ? updated : row)));
      setSelected((current) => (current?.id === report.id ? updated : current));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">Data quality</p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">Báo lỗi dữ liệu</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Theo dõi các báo cáo sai ảnh, sai tọa độ, sai mô tả và thiếu thông tin từ người dùng.
          </p>
        </div>
        <div className="rounded-full bg-surface-container px-4 py-2 text-body-sm text-on-surface-variant">
          {total} report
        </div>
      </header>

      <section className="mb-5 grid gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm md:grid-cols-[1fr,220px,220px]">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={placeSlug}
            onChange={(event) => setPlaceSlug(event.target.value)}
            placeholder="Lọc theo slug địa danh..."
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as DataReportStatus | '')}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {STATUSES.map((item) => (
            <option key={item.value || 'all'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as DataReportType | '')}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {TYPES.map((item) => (
            <option key={item.value || 'all'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="mb-5 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-on-error-container">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">Chưa có báo lỗi dữ liệu.</div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {rows.map((report) => (
              <li key={report.id} className="grid gap-4 p-5 lg:grid-cols-[1fr,240px]">
                <button type="button" onClick={() => setSelected(report)} className="text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-on-surface">{report.placeSlug}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        report.status,
                      )}`}
                    >
                      {report.status}
                    </span>
                    <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs text-on-surface-variant">
                      {report.type}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">
                    {report.message}
                  </p>
                  <p className="mt-2 text-xs text-outline">{formatDate(report.createdAt)}</p>
                </button>

                <div className="flex flex-col gap-2">
                  <select
                    value={report.status}
                    disabled={savingId === report.id}
                    onChange={(event) =>
                      void changeStatus(report, event.target.value as DataReportStatus)
                    }
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary"
                  >
                    {STATUSES.filter((item) => item.value).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/dia-diem/${report.placeSlug}`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-body-sm font-semibold text-primary hover:bg-primary-fixed"
                  >
                    <Icon name="open_in_new" className="!text-base" />
                    Mở trang địa điểm
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-scrim/50" onClick={() => setSelected(null)}>
          <aside
            className="ml-auto flex h-full w-full max-w-lg flex-col bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-overline uppercase tracking-overline text-primary">
                  Chi tiết báo lỗi
                </p>
                <h2 className="mt-1 font-h3 text-h3 text-on-surface">{selected.placeSlug}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
                aria-label="Đóng"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4 text-body-md text-on-surface-variant">
              <p>
                <span className="font-semibold text-on-surface">Loại lỗi: </span>
                {selected.type}
              </p>
              <p>
                <span className="font-semibold text-on-surface">Trạng thái: </span>
                {selected.status}
              </p>
              <p>
                <span className="font-semibold text-on-surface">Liên hệ: </span>
                {selected.contact ?? '-'}
              </p>
              <p>
                <span className="font-semibold text-on-surface">Tạo lúc: </span>
                {formatDate(selected.createdAt)}
              </p>
              <div>
                <p className="mb-2 font-semibold text-on-surface">Nội dung báo lỗi</p>
                <div className="whitespace-pre-line rounded-2xl bg-surface-container p-4">
                  {selected.message}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/dia-diem/${selected.placeSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-3 font-semibold text-primary hover:bg-primary-fixed"
                >
                  <Icon name="open_in_new" />
                  Mở địa điểm
                </Link>
                <Link
                  href={`/admin/dia-diem/${selected.placeSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary hover:bg-primary/90"
                >
                  <Icon name="edit" />
                  Sửa dữ liệu
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
