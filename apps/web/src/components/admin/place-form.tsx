'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { useRouter } from '@/i18n/navigation';
import { placeCategoryName, placeRegionName } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import {
  adminCreatePlace,
  adminUpdatePlace,
  type PlacePayload,
  type PlaceUpdatePayload,
} from '@/lib/admin-places-client';
import type { Category, Place, Region } from '@vivu/types';
import { CloudinaryUpload, type UploadedImage } from './cloudinary-upload';

const SEASONS = [
  { value: 'spring', labelKey: 'seasonSpring' },
  { value: 'summer', labelKey: 'seasonSummer' },
  { value: 'autumn', labelKey: 'seasonAutumn' },
  { value: 'winter', labelKey: 'seasonWinter' },
] as const;

const STATUSES = [
  { value: 'draft', labelKey: 'statusDraft' },
  { value: 'published', labelKey: 'statusPublished' },
  { value: 'archived', labelKey: 'statusArchivedFull' },
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
  const t = useTranslations('admin');
  const locale = useLocale() as Locale;
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
      setError(t('formRequiredError'));
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('errSessionExpired'));
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
      setError(err instanceof Error ? err.message : t('errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">
            {t('formBasicInfo')}
          </legend>
          <div className="space-y-4">
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formTitleVi')}
              </span>
              <input
                type="text"
                value={state.titleVi}
                onChange={(e) => set('titleVi', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formTitleEn')}
              </span>
              <input
                type="text"
                value={state.titleEn}
                onChange={(e) => set('titleEn', e.target.value)}
                placeholder={t('formTitleEnPlaceholder')}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-lg focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formSlug')}
              </span>
              <input
                type="text"
                value={state.slug}
                onChange={(e) => set('slug', e.target.value)}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder={t('formSlugPlaceholder')}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
              <span className="mt-1 block text-body-sm text-outline">{t('formSlugHint')}</span>
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formSummaryVi')}
              </span>
              <textarea
                rows={3}
                value={state.summaryVi}
                onChange={(e) => set('summaryVi', e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formSummaryEn')}
              </span>
              <textarea
                rows={3}
                value={state.summaryEn}
                onChange={(e) => set('summaryEn', e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formAddress')}
              </span>
              <input
                type="text"
                value={state.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder={t('formAddressPlaceholder')}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">
            {t('formDescription')}
          </legend>
          <label className="block">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              {t('formDescVi')}
            </span>
            <textarea
              rows={10}
              value={state.descriptionVi}
              onChange={(e) => set('descriptionVi', e.target.value)}
              placeholder={t('formDescViPlaceholder')}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-sans text-body-md leading-relaxed focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              {t('formDescEn')}
            </span>
            <textarea
              rows={6}
              value={state.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              placeholder={t('formDescEnPlaceholder')}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-sans text-body-md leading-relaxed focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
          </label>
          <p className="mt-2 text-body-sm text-outline">{t('formMarkdownHint')}</p>
        </fieldset>

        <fieldset className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <legend className="mb-4 px-2 font-h4 text-h4 text-on-surface">{t('formCoords')}</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formLat')}
              </span>
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={state.lat}
                onChange={(e) => set('lat', e.target.value)}
                placeholder="20.9101"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                {t('formLng')}
              </span>
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={state.lng}
                onChange={(e) => set('lng', e.target.value)}
                placeholder="107.1839"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 font-mono text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-4 font-h4 text-h4 text-on-surface">{t('formStatus')}</h3>
          <label className="block">
            <span className="text-overline uppercase tracking-overline text-on-surface-variant">
              {t('formStatusLabel')}
            </span>
            <select
              value={state.status}
              onChange={(e) => set('status', e.target.value as FormState['status'])}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-4 font-h4 text-h4 text-on-surface">{t('formRegion')}</h3>
          <select
            value={state.regionId}
            onChange={(e) => set('regionId', e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
          >
            {regions.length === 0 && <option value="">{t('formRegionLoading')}</option>}
            {parentRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {placeRegionName(r, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-2 font-h4 text-h4 text-on-surface">{t('formSeasons')}</h3>
          <p className="mb-3 text-body-sm text-outline">{t('formSeasonsHint')}</p>
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
                  {t(s.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
          <h3 className="mb-2 font-h4 text-h4 text-on-surface">{t('formCategories')}</h3>
          <p className="mb-3 text-body-sm text-outline">{t('formCategoriesHint')}</p>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <span className="text-body-sm text-on-surface-variant">
                {t('formCategoriesLoading')}
              </span>
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
                  {placeCategoryName(c, locale)}
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
              placeholder={t('formHeroPlaceholder')}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
          </label>
          {state.heroImageUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-outline-variant/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.heroImageUrl}
                alt={t('formHeroPreviewAlt')}
                className="h-32 w-full object-cover"
              />
            </div>
          )}
          <p className="mt-2 text-body-sm text-outline">{t('formHeroHint')}</p>
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
                {mode === 'create' ? t('formCreating') : t('formSubmitting')}
              </>
            ) : (
              <>
                <Icon name="save" className="text-base" />
                {mode === 'create' ? t('formCreate') : t('formSubmit')}
              </>
            )}
          </button>
        </div>
      </aside>
    </form>
  );
}
