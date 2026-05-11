'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import {
  adminCreatePlace,
  adminUpdatePlace,
  type PlacePayload,
  type PlaceUpdatePayload,
} from '@/lib/admin-places-client';
import type { Category, Place, Region } from '@vivu/types';
import { CloudinaryUpload, type UploadedImage } from './cloudinary-upload';

const SEASONS = [
  { value: 'spring', label: 'Mùa Xuân' },
  { value: 'summer', label: 'Mùa Hạ' },
  { value: 'autumn', label: 'Mùa Thu' },
  { value: 'winter', label: 'Mùa Đông' },
] as const;

const STATUSES = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'archived', label: 'Đã lưu trữ' },
] as const;

interface FormState {
  slug: string;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
  descriptionVi: string;
  descriptionEn: string;
  regionId: string;
  address: string;
  lat: string;
  lng: string;
  bestSeasons: string[];
  status: 'draft' | 'published' | 'archived';
  heroImageUrl: string;
  categoryIds: string[];
}

function toForm(p: Place | null, defaultRegionId: string): FormState {
  if (!p) {
    return {
      slug: '',
      titleVi: '',
      titleEn: '',
      summaryVi: '',
      summaryEn: '',
      descriptionVi: '',
      descriptionEn: '',
      regionId: defaultRegionId,
      address: '',
      lat: '',
      lng: '',
      bestSeasons: [],
      status: 'draft',
      heroImageUrl: '',
      categoryIds: [],
    };
  }
  return {
    slug: p.slug,
    titleVi: p.titleVi,
    titleEn: p.titleEn ?? '',
    summaryVi: p.summaryVi ?? '',
    summaryEn: p.summaryEn ?? '',
    descriptionVi: p.descriptionVi ?? '',
    descriptionEn: p.descriptionEn ?? '',
    regionId: p.regionId,
    address: p.address ?? '',
    lat: p.geo?.lat !== undefined && p.geo !== null ? String(p.geo.lat) : '',
    lng: p.geo?.lng !== undefined && p.geo !== null ? String(p.geo.lng) : '',
    bestSeasons: [...(p.bestSeasons ?? [])],
    status: p.status,
    heroImageUrl: p.heroImageUrl ?? '',
    categoryIds: (p.categories ?? []).map((c) => c.id),
  };
}

function buildPayload(state: FormState): PlacePayload {
  const payload: PlacePayload = {
    slug: state.slug.trim(),
    titleVi: state.titleVi.trim(),
    regionId: state.regionId,
    status: state.status,
    bestSeasons: state.bestSeasons,
    categoryIds: state.categoryIds,
  };
  if (state.titleEn.trim()) payload.titleEn = state.titleEn.trim();
  if (state.summaryVi.trim()) payload.summaryVi = state.summaryVi.trim();
  if (state.summaryEn.trim()) payload.summaryEn = state.summaryEn.trim();
  if (state.descriptionVi.trim()) payload.descriptionVi = state.descriptionVi.trim();
  if (state.descriptionEn.trim()) payload.descriptionEn = state.descriptionEn.trim();
  if (state.address.trim()) payload.address = state.address.trim();
  if (state.heroImageUrl.trim()) payload.heroImageUrl = state.heroImageUrl.trim();
  if (state.lat.trim() && state.lng.trim()) {
    const lat = Number(state.lat);
    const lng = Number(state.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      payload.geo = { lat, lng };
    }
  }
  return payload;
}

interface PlaceFormProps {
  mode: 'create' | 'edit';
  initialPlace?: Place | null;
  regions: Region[];
  categories: Category[];
}

export function PlaceForm({ mode, initialPlace, regions, categories }: PlaceFormProps) {
  const { getAccessToken } = useAuth();
  const router = useRouter();
  const parentRegions = useMemo(() => regions.filter((r) => r.parentId === null), [regions]);
  const defaultRegionId = parentRegions[0]?.id ?? regions[0]?.id ?? '';
  const [state, setState] = useState<FormState>(() =>
    toForm(initialPlace ?? null, defaultRegionId),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialPlace) {
      setState(toForm(initialPlace, defaultRegionId));
    }
  }, [initialPlace, defaultRegionId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const toggleArray = (key: 'bestSeasons' | 'categoryIds', value: string): void => {
    setState((s) => {
      const existing = s[key];
      const next = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...s, [key]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!state.titleVi.trim() || !state.slug.trim() || !state.regionId) {
      setError('Vui lòng điền slug, tên (tiếng Việt), và chọn vùng.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      const payload = buildPayload(state);
      if (mode === 'create') {
        const created = await adminCreatePlace(payload, token);
        router.push(`/admin/dia-diem/${created.slug}`);
        router.refresh();
      } else if (initialPlace) {
        const updatePayload: PlaceUpdatePayload = payload;
        const updated = await adminUpdatePlace(initialPlace.id, updatePayload, token);
        if (updated.slug !== initialPlace.slug) {
          router.replace(`/admin/dia-diem/${updated.slug}`);
        }
        router.refresh();
        // Normalise local state to server values
        setState(toForm(updated, defaultRegionId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">Thông tin cơ bản</legend>
          <div className="space-y-4">
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Tên (tiếng Việt) *
              </span>
              <input
                type="text"
                value={state.titleVi}
                onChange={(e) => set('titleVi', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Tên (English)
              </span>
              <input
                type="text"
                value={state.titleEn}
                onChange={(e) => set('titleEn', e.target.value)}
                placeholder="Tên tiếng Anh (tuỳ chọn)"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Slug *
              </span>
              <input
                type="text"
                value={state.slug}
                onChange={(e) => set('slug', e.target.value)}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="vinh-ha-long"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
              <span className="mt-1 block text-body-sm text-outline">
                Chỉ chữ thường, số, dấu gạch ngang. Ví dụ: <code>vinh-ha-long</code>.
              </span>
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Tóm tắt (tiếng Việt)
              </span>
              <textarea
                rows={3}
                value={state.summaryVi}
                onChange={(e) => set('summaryVi', e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Tóm tắt (English)
              </span>
              <textarea
                rows={3}
                value={state.summaryEn}
                onChange={(e) => set('summaryEn', e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Địa chỉ
              </span>
              <input
                type="text"
                value={state.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Tỉnh, thành phố, địa danh..."
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">Mô tả chi tiết</legend>
          <label className="block">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              Tiếng Việt
            </span>
            <textarea
              rows={10}
              value={state.descriptionVi}
              onChange={(e) => set('descriptionVi', e.target.value)}
              placeholder="Viết mô tả chi tiết: lịch sử, đặc trưng, điểm nổi bật..."
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-sans text-body-md leading-relaxed focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              English
            </span>
            <textarea
              rows={6}
              value={state.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              placeholder="English description (optional)"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-sans text-body-md leading-relaxed focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </label>
          <p className="mt-2 text-body-sm text-outline">
            Hỗ trợ Markdown cơ bản (in đậm, in nghiêng, danh sách, link).
          </p>
        </fieldset>

        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">Toạ độ</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Vĩ độ (lat)
              </span>
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={state.lat}
                onChange={(e) => set('lat', e.target.value)}
                placeholder="20.9101"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Kinh độ (lng)
              </span>
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={state.lng}
                onChange={(e) => set('lng', e.target.value)}
                placeholder="107.1839"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
              />
            </label>
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
              value={state.status}
              onChange={(e) => set('status', e.target.value as FormState['status'])}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-4 font-h4 text-h4 text-on-surface">Vùng miền</h3>
          <select
            value={state.regionId}
            onChange={(e) => set('regionId', e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-white focus:ring-2 focus:ring-primary"
          >
            {regions.length === 0 && <option value="">Đang tải vùng…</option>}
            {parentRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameVi}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-2 font-h4 text-h4 text-on-surface">Mùa đẹp nhất</h3>
          <p className="mb-3 text-body-sm text-outline">Chọn 1 hoặc nhiều mùa.</p>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => {
              const active = state.bestSeasons.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleArray('bestSeasons', s.value)}
                  className={
                    active
                      ? 'rounded-full bg-primary px-3 py-1.5 text-body-sm font-semibold text-white'
                      : 'rounded-full bg-surface-container px-3 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-2 font-h4 text-h4 text-on-surface">Chuyên mục</h3>
          <p className="mb-3 text-body-sm text-outline">Có thể chọn nhiều chuyên mục.</p>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <span className="text-body-sm text-on-surface-variant">Đang tải chuyên mục…</span>
            )}
            {categories.map((c) => {
              const active = state.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleArray('categoryIds', c.id)}
                  className={
                    active
                      ? 'inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-body-sm font-semibold text-white'
                      : 'inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 text-body-sm font-medium text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
                  }
                >
                  {c.icon && <Icon name={c.icon} className="!text-sm" />}
                  {c.nameVi}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-3 font-h4 text-h4 text-on-surface">Ảnh đại diện</h3>
          <CloudinaryUpload
            currentUrl={state.heroImageUrl || null}
            folder="vivu/places"
            onUploaded={(img: UploadedImage) => set('heroImageUrl', img.url)}
            buttonLabel={state.heroImageUrl ? 'Thay ảnh hero' : 'Tải ảnh hero'}
          />
          <details className="mt-3">
            <summary className="cursor-pointer text-body-sm text-outline hover:text-on-surface">
              Hoặc dán URL ảnh sẵn
            </summary>
            <input
              type="url"
              value={state.heroImageUrl}
              onChange={(e) => set('heroImageUrl', e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-sm focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </details>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Icon name="hourglass_empty" className="text-base" />
                Đang lưu…
              </>
            ) : (
              <>
                <Icon name="save" className="text-base" />
                {mode === 'create' ? 'Tạo địa điểm' : 'Lưu thay đổi'}
              </>
            )}
          </button>
        </div>
      </aside>
    </form>
  );
}
