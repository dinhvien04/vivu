'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import {
  generateTripPlan,
  saveTripPlanToCollection,
  type GeneratedTripPlan,
} from '@/lib/trip-planner-client';

const AREAS = [
  { slug: 'all', vi: 'Toàn tỉnh', en: 'All areas' },
  { slug: 'pleiku', vi: 'Pleiku', en: 'Pleiku' },
  { slug: 'quy-nhon', vi: 'Quy Nhơn', en: 'Quy Nhon' },
  { slug: 'an-nhon', vi: 'An Nhơn', en: 'An Nhon' },
  { slug: 'tuy-phuoc', vi: 'Tuy Phước', en: 'Tuy Phuoc' },
  { slug: 'phu-cat', vi: 'Phù Cát', en: 'Phu Cat' },
  { slug: 'phu-my', vi: 'Phù Mỹ', en: 'Phu My' },
  { slug: 'hoai-nhon', vi: 'Hoài Nhơn', en: 'Hoai Nhon' },
] as const;

const INTERESTS = [
  { slug: 'bien-dao', vi: 'Biển đảo', en: 'Beaches' },
  { slug: 'thap-cham', vi: 'Tháp Chăm', en: 'Cham towers' },
  { slug: 'di-tich', vi: 'Di tích', en: 'Historic sites' },
  { slug: 'ho-thac-suoi', vi: 'Hồ - thác - suối', en: 'Lakes and falls' },
  { slug: 'am-thuc', vi: 'Ẩm thực', en: 'Food' },
  { slug: 'gia-dinh', vi: 'Gia đình', en: 'Family friendly' },
] as const;

const TRANSPORTS = [
  { slug: 'xe_may', vi: 'Xe máy', en: 'Motorbike' },
  { slug: 'oto', vi: 'Ô tô', en: 'Car' },
  { slug: 'xe_khach', vi: 'Xe khách', en: 'Coach' },
  { slug: 'di_bo_ket_hop', vi: 'Đi bộ kết hợp', en: 'Walking + transfers' },
] as const;

function text(locale: Locale) {
  const vi = locale !== 'en';
  return {
    eyebrow: vi ? 'Lịch trình AI' : 'AI trip planner',
    title: vi ? 'Lập lịch trình du lịch bằng AI' : 'Plan your trip with AI',
    lead: vi
      ? 'Nhập số ngày, khu vực, sở thích và ngân sách. Vivu sẽ gợi ý lịch trình dựa trên dữ liệu địa danh trong hệ thống.'
      : 'Enter days, area, interests and budget. Vivu suggests an itinerary from destination data in the system.',
    area: vi ? 'Khu vực' : 'Area',
    days: vi ? 'Số ngày' : 'Days',
    people: vi ? 'Số người' : 'People',
    transport: vi ? 'Di chuyển' : 'Transport',
    budget: vi ? 'Ngân sách dự kiến' : 'Budget',
    note: vi ? 'Ghi chú thêm' : 'Extra notes',
    notePlaceholder: vi
      ? 'Ví dụ: đi cùng gia đình, thích chụp ảnh, không muốn đi quá xa...'
      : 'Example: family trip, photo spots, avoid long transfers...',
    generate: vi ? 'Tạo lịch trình' : 'Generate plan',
    regenerate: vi ? 'Tạo lại' : 'Regenerate',
    generating: vi ? 'Đang tạo lịch trình...' : 'Generating...',
    interests: vi ? 'Sở thích' : 'Interests',
    result: vi ? 'Lịch trình gợi ý' : 'Suggested itinerary',
    generalTips: vi ? 'Lưu ý chung' : 'General tips',
    missing: vi ? 'Ghi chú dữ liệu' : 'Data note',
    food: vi ? 'Gợi ý ăn uống' : 'Food suggestions',
    notes: vi ? 'Ghi chú trong ngày' : 'Day notes',
    viewPlace: vi ? 'Xem địa danh' : 'View place',
    viewMap: vi ? 'Xem bản đồ' : 'View map',
    save: vi ? 'Lưu vào sổ tay' : 'Save to collection',
    saved: vi ? 'Đã lưu vào sổ tay' : 'Saved to collection',
    needLogin: vi ? 'Đăng nhập để lưu lịch trình vào sổ tay.' : 'Sign in to save this plan.',
    consult: vi ? 'Cần người tư vấn lịch trình này?' : 'Want help with this plan?',
    consultCta: vi ? 'Gửi yêu cầu tư vấn' : 'Request consultation',
    exploreMore: vi ? 'Khám phá thêm địa danh' : 'Explore more destinations',
    quota: vi
      ? 'Nếu hết quota, hãy đăng nhập hoặc thử lại vào ngày mai.'
      : 'If quota is exhausted, sign in or try again tomorrow.',
    error: vi ? 'Không tạo được lịch trình. Vui lòng thử lại.' : 'Could not generate plan.',
    day: vi ? 'Ngày' : 'Day',
  };
}

function label(locale: Locale, item: { vi: string; en: string }) {
  return locale === 'en' ? item.en : item.vi;
}

export function TripPlannerPage() {
  const locale = useLocale() as Locale;
  const labels = text(locale);
  const { getAccessToken, user } = useAuth();
  const [area, setArea] = useState('all');
  const [days, setDays] = useState(2);
  const [peopleCount, setPeopleCount] = useState(2);
  const [transport, setTransport] = useState('xe_may');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');
  const [interests, setInterests] = useState<string[]>(['bien-dao', 'di-tich']);
  const [result, setResult] = useState<GeneratedTripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const selectedInterestLabels = useMemo(
    () =>
      INTERESTS.filter((item) => interests.includes(item.slug))
        .map((item) => label(locale, item))
        .join(', '),
    [interests, locale],
  );

  const toggleInterest = (slug: string) => {
    setInterests((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSaveState('idle');
    try {
      const token = await getAccessToken();
      const generated = await generateTripPlan(
        {
          area,
          days,
          peopleCount,
          transport,
          interests,
          budget: budget.trim() || undefined,
          note: note.trim() || undefined,
          locale,
        },
        token,
      );
      setResult(generated);
      await trackAnalyticsEvent('trip_plan_generated', {
        bearer: token,
        metadata: { area, days, peopleCount, transport, interests: selectedInterestLabels },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!result || saveState !== 'idle') return;
    const token = await getAccessToken();
    if (!token) {
      setError(labels.needLogin);
      return;
    }
    setSaveState('saving');
    try {
      await saveTripPlanToCollection(result.id, token);
      setSaveState('saved');
    } catch (err) {
      setSaveState('idle');
      setError(err instanceof Error ? err.message : labels.error);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[420px,1fr]">
      <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-premium">
        <p className="text-overline uppercase tracking-overline text-primary">{labels.eyebrow}</p>
        <h1 className="mt-2 font-h2 text-h2 text-on-surface">{labels.title}</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">{labels.lead}</p>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-label-md font-semibold text-on-surface">{labels.area}</span>
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {AREAS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {label(locale, item)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-label-md font-semibold text-on-surface">{labels.days}</span>
              <input
                type="number"
                min={1}
                max={5}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="text-label-md font-semibold text-on-surface">{labels.people}</span>
              <input
                type="number"
                min={1}
                max={50}
                value={peopleCount}
                onChange={(event) => setPeopleCount(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-label-md font-semibold text-on-surface">{labels.transport}</span>
            <select
              value={transport}
              onChange={(event) => setTransport(event.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {TRANSPORTS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {label(locale, item)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-label-md font-semibold text-on-surface">{labels.interests}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((item) => {
                const active = interests.includes(item.slug);
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => toggleInterest(item.slug)}
                    className={`rounded-full border px-3 py-2 text-body-sm transition ${
                      active
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {label(locale, item)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-label-md font-semibold text-on-surface">{labels.budget}</span>
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={locale === 'en' ? 'Flexible / medium' : 'Linh hoạt / vừa phải'}
            />
          </label>

          <label className="block">
            <span className="text-label-md font-semibold text-on-surface">{labels.note}</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={labels.notePlaceholder}
            />
          </label>

          {error && (
            <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
          >
            <Icon name="auto_awesome" size={20} />
            {loading ? labels.generating : labels.generate}
          </button>
          <p className="text-center text-xs text-outline">{labels.quota}</p>
        </div>
      </section>

      <section className="min-h-[640px] rounded-3xl border border-outline-variant/40 bg-surface p-6 shadow-sm">
        {!result && !loading && (
          <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon name="route" size={42} />
            </div>
            <h2 className="mt-5 font-h3 text-h3 text-on-surface">{labels.result}</h2>
            <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{labels.lead}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-2xl border border-outline-variant/30 p-5">
                <div className="h-5 w-1/3 animate-pulse rounded bg-surface-container" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        )}

        {result && (
          <article>
            <div className="mb-6 flex flex-col gap-4 border-b border-outline-variant/40 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-overline uppercase tracking-overline text-primary">
                  {labels.result}
                </p>
                <h2 className="mt-1 font-h2 text-h2 text-on-surface">{result.output.title}</h2>
                <p className="mt-2 text-body-md text-on-surface-variant">{result.output.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
                >
                  <Icon name="refresh" size={18} />
                  {loading ? labels.generating : labels.regenerate}
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={save}
                    disabled={saveState !== 'idle'}
                    className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-body-sm font-semibold text-primary transition hover:bg-primary-fixed disabled:opacity-60"
                  >
                    <Icon name={saveState === 'saved' ? 'check' : 'bookmark_add'} size={18} />
                    {saveState === 'saved' ? labels.saved : labels.save}
                  </button>
                ) : (
                  <Link
                    href="/dang-nhap"
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
                  >
                    <Icon name="login" size={18} />
                    {labels.needLogin}
                  </Link>
                )}
                <Link
                  href={`/tu-van?source=trip_planner&note=${encodeURIComponent(result.output.title)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:bg-primary/90"
                >
                  <Icon name="support_agent" size={18} />
                  {labels.consultCta}
                </Link>
                <Link
                  href="/kham-pha"
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
                >
                  <Icon name="travel_explore" size={18} />
                  {labels.exploreMore}
                </Link>
              </div>
            </div>

            <div className="space-y-5">
              {result.output.days.map((day) => (
                <section
                  key={day.day}
                  className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5"
                >
                  <h3 className="font-h3 text-h3 text-on-surface">
                    {labels.day} {day.day}: {day.theme}
                  </h3>
                  <ol className="mt-4 space-y-4">
                    {day.items.map((item, index) => (
                      <li key={`${day.day}-${index}`} className="rounded-xl bg-surface p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-overline uppercase tracking-overline text-primary">
                              {item.timeOfDay} - {item.suggestedDuration}
                            </p>
                            <h4 className="mt-1 text-lg font-bold text-on-surface">
                              {item.placeName}
                            </h4>
                            <p className="mt-2 text-body-md text-on-surface-variant">
                              {item.reason}
                            </p>
                          </div>
                          {item.placeSlug && (
                            <div className="flex flex-shrink-0 flex-wrap gap-2">
                              <Link
                                href={`/dia-diem/${item.placeSlug}`}
                                className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-body-sm font-semibold text-primary hover:bg-primary-fixed"
                              >
                                {labels.viewPlace}
                                <Icon name="arrow_forward" size={16} />
                              </Link>
                              <Link
                                href={`/ban-do?place=${item.placeSlug}`}
                                className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-body-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
                              >
                                <Icon name="map" size={16} />
                                {labels.viewMap}
                              </Link>
                            </div>
                          )}
                        </div>
                        {item.travelNote && (
                          <p className="mt-3 rounded-lg bg-secondary-container/60 px-3 py-2 text-body-sm text-on-secondary-container">
                            {item.travelNote}
                          </p>
                        )}
                        {item.tips.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {item.tips.map((tip) => (
                              <li
                                key={tip}
                                className="rounded-full bg-primary-fixed px-3 py-1 text-xs text-primary"
                              >
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>

                  {day.foodSuggestions.length > 0 && (
                    <p className="mt-4 text-body-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{labels.food}: </span>
                      {day.foodSuggestions.join(', ')}
                    </p>
                  )}
                  {day.notes.length > 0 && (
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{labels.notes}: </span>
                      {day.notes.join(' ')}
                    </p>
                  )}
                </section>
              ))}
            </div>

            {(result.output.generalTips.length > 0 || result.output.missingDataNote) && (
              <aside className="mt-6 rounded-2xl border border-primary/20 bg-primary-fixed/30 p-5">
                {result.output.generalTips.length > 0 && (
                  <>
                    <h3 className="font-bold text-on-surface">{labels.generalTips}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
                      {result.output.generalTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}
                {result.output.missingDataNote && (
                  <p className="mt-4 text-body-sm text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{labels.missing}: </span>
                    {result.output.missingDataNote}
                  </p>
                )}
              </aside>
            )}
          </article>
        )}
      </section>
    </div>
  );
}
