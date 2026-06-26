'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { createLead } from '@/lib/leads-client';
import type { LeadSource } from '@vivu/types';

interface LeadFormPageProps {
  initialSource?: LeadSource;
  initialPlaceSlug?: string;
  initialPlaceName?: string;
  initialNote?: string;
}

const SOURCES: LeadSource[] = ['place_detail', 'ai_chat', 'trip_planner', 'home', 'other'];
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const NOTE_MAX_LENGTH = 1000;

function safeSource(value?: string): LeadSource {
  return SOURCES.includes(value as LeadSource) ? (value as LeadSource) : 'other';
}

function text(locale: Locale) {
  const vi = locale !== 'en';
  return {
    eyebrow: vi ? 'Tư vấn du lịch' : 'Travel consultation',
    title: vi ? 'Tư vấn chuyến đi cùng Vivu' : 'Plan with Vivu consulting',
    lead: vi
      ? 'Gửi thông tin chuyến đi, Vivu sẽ ghi nhận yêu cầu để hỗ trợ bạn qua số điện thoại hoặc Zalo đã cung cấp.'
      : 'Send your trip details. Vivu will record the request and support you by the phone or Zalo you provide.',
    name: vi ? 'Họ tên' : 'Full name',
    phone: vi ? 'Số điện thoại hoặc Zalo *' : 'Phone or Zalo *',
    email: vi ? 'Email (không bắt buộc)' : 'Email (optional)',
    place: vi ? 'Địa danh hoặc khu vực quan tâm' : 'Interested place or area',
    area: vi ? 'Khu vực muốn đi' : 'Area',
    travelDate: vi ? 'Ngày dự kiến' : 'Travel date',
    people: vi ? 'Số người' : 'People',
    budget: vi ? 'Ngân sách' : 'Budget',
    note: vi ? 'Nhu cầu / ghi chú' : 'Needs / notes',
    notePlaceholder: vi
      ? 'Ví dụ: đi 2 ngày 1 đêm, thích biển đảo và tháp Chăm, cần gợi ý quán ăn...'
      : 'Example: 2 days 1 night, beaches and Cham towers, food suggestions...',
    submit: vi ? 'Gửi yêu cầu tư vấn' : 'Send request',
    submitting: vi ? 'Đang gửi...' : 'Sending...',
    successTitle: vi
      ? 'Vivu đã nhận yêu cầu tư vấn của bạn.'
      : 'Vivu received your consultation request.',
    successLead: vi
      ? 'Thông tin đã được ghi nhận trong hệ thống để đội ngũ Vivu xử lý.'
      : 'Your information has been recorded in the system for the Vivu team to process.',
    backExplore: vi ? 'Quay lại khám phá' : 'Back to explore',
    error: vi ? 'Không gửi được yêu cầu. Vui lòng thử lại.' : 'Could not send request.',
    privacy: vi
      ? 'Thông tin liên hệ chỉ dùng để tư vấn chuyến đi, không hiển thị công khai.'
      : 'Contact data is used only for trip consultation and is not public.',
    planFirst: vi
      ? 'Chưa có lịch trình? Tạo lịch trình AI trước.'
      : 'No itinerary yet? Create an AI itinerary first.',
  };
}

export function LeadFormPage({
  initialSource,
  initialPlaceSlug,
  initialPlaceName,
  initialNote,
}: LeadFormPageProps) {
  const locale = useLocale() as Locale;
  const labels = text(locale);
  const { getAccessToken } = useAuth();
  const [name, setName] = useState('');
  const [phoneOrZalo, setPhoneOrZalo] = useState('');
  const [email, setEmail] = useState('');
  const [placeName, setPlaceName] = useState(initialPlaceName ?? '');
  const [area, setArea] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState(initialNote ?? '');
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const source = safeSource(initialSource);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      await createLead(
        {
          name,
          phoneOrZalo,
          email: email.trim() || undefined,
          interestedPlaceSlug: initialPlaceSlug,
          interestedPlaceName: placeName.trim() || undefined,
          area: area.trim() || undefined,
          travelDate: travelDate || undefined,
          peopleCount,
          budget: budget.trim() || undefined,
          note: note.trim() || undefined,
          source,
          website,
          turnstileToken: turnstileToken || undefined,
        },
        token,
      );
      await trackAnalyticsEvent('lead_form_submitted', {
        bearer: token,
        placeSlug: initialPlaceSlug,
        metadata: {
          source,
          peopleCount,
          hasArea: area.trim().length > 0,
          hasBudget: budget.trim().length > 0,
          hasEmail: email.trim().length > 0,
          hasNote: note.trim().length > 0,
          hasPlace: Boolean(initialPlaceSlug || placeName.trim()),
          hasTravelDate: Boolean(travelDate),
        },
      });
      setSuccess(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : labels.error;
      if (
        errMsg.includes('expired') ||
        errMsg.includes('timeout-or-duplicate') ||
        errMsg.includes('Turnstile') ||
        errMsg.includes('token')
      ) {
        setError(
          locale === 'en'
            ? 'Verification session expired. Please verify again.'
            : 'Phiên xác minh đã hết hạn. Vui lòng xác minh lại.',
        );
      } else {
        setError(errMsg);
      }
      setTurnstileToken('');
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-premium">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon name="check_circle" size={36} />
        </div>
        <h1 className="mt-5 font-h2 text-h2 text-on-surface">{labels.successTitle}</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">{labels.successLead}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/kham-pha"
            className="rounded-full border border-primary px-5 py-2 font-semibold text-primary hover:bg-primary-fixed"
          >
            {labels.backExplore}
          </Link>
          <Link
            href="/lich-trinh"
            className="rounded-full bg-primary px-5 py-2 font-semibold text-on-primary hover:bg-primary/90"
          >
            {locale === 'en' ? 'Create another plan' : 'Tạo lịch trình khác'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr,1.2fr]">
      <section className="rounded-3xl bg-gradient-to-br from-primary-fixed via-secondary-container/50 to-surface-container p-8">
        <p className="text-overline uppercase tracking-overline text-primary">{labels.eyebrow}</p>
        <h1 className="mt-2 font-h1 text-h1 text-on-surface">{labels.title}</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">{labels.lead}</p>
        <div className="mt-8 space-y-4 text-body-md text-on-surface-variant">
          <p className="flex gap-2">
            <Icon name="support_agent" className="mt-0.5 text-primary" />
            {locale === 'en'
              ? 'Good for custom itinerary, group trip, or data questions.'
              : 'Phù hợp khi cần lịch trình riêng, đi theo nhóm, hoặc cần hỏi thêm về địa danh.'}
          </p>
          <p className="flex gap-2">
            <Icon name="lock" className="mt-0.5 text-primary" />
            {labels.privacy}
          </p>
        </div>
        <Link
          href="/lich-trinh"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary transition hover:bg-primary/90"
        >
          <Icon name="route" size={18} />
          {labels.planFirst}
        </Link>
      </section>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-premium"
      >
        <div className="space-y-6">
          {/* Section 1: Contact Info */}
          <fieldset className="space-y-4">
            <legend className="text-body-md font-bold text-primary uppercase tracking-wider mb-2 border-b border-outline-variant/30 pb-1 w-full">
              {locale === 'en' ? 'Contact Information' : 'Thông tin liên hệ'}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">{labels.name}</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">{labels.phone}</span>
                <input
                  required
                  value={phoneOrZalo}
                  onChange={(event) => setPhoneOrZalo(event.target.value)}
                  maxLength={50}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-label-md font-semibold text-on-surface">{labels.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          </fieldset>

          {/* Section 2: Travel Requirements */}
          <fieldset className="space-y-4">
            <legend className="text-body-md font-bold text-primary uppercase tracking-wider mb-2 border-b border-outline-variant/30 pb-1 w-full">
              {locale === 'en' ? 'Travel Requirements' : 'Nhu cầu chuyến đi'}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">{labels.place}</span>
                <input
                  value={placeName}
                  onChange={(event) => setPlaceName(event.target.value)}
                  maxLength={200}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">{labels.area}</span>
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  maxLength={160}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">
                  {labels.travelDate}
                </span>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(event) => setTravelDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="grid gap-4 grid-cols-2">
                <label className="block">
                  <span className="text-label-md font-semibold text-on-surface">
                    {labels.people}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={peopleCount}
                    onChange={(event) => setPeopleCount(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block">
                  <span className="text-label-md font-semibold text-on-surface">
                    {labels.budget}
                  </span>
                  <input
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    maxLength={200}
                    className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            </div>
          </fieldset>

          {/* Section 3: Extra Notes */}
          <fieldset className="space-y-4">
            <legend className="text-body-md font-bold text-primary uppercase tracking-wider mb-2 border-b border-outline-variant/30 pb-1 w-full">
              {locale === 'en' ? 'Extra Notes' : 'Ghi chú thêm'}
            </legend>
            <label className="block">
              <span className="text-label-md font-semibold text-on-surface">{labels.note}</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                maxLength={NOTE_MAX_LENGTH}
                placeholder={labels.notePlaceholder}
                className="mt-2 w-full resize-none rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="mt-1 block text-right text-xs text-on-surface-variant">
                {note.length}/{NOTE_MAX_LENGTH}
              </span>
            </label>
          </fieldset>
        </div>

        <label className="sr-only">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <div className="mt-4">
          <TurnstileWidget
            siteKey={TURNSTILE_SITE_KEY}
            onToken={setTurnstileToken}
            resetKey={turnstileResetKey}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
        >
          <Icon name="send" size={20} />
          {loading ? labels.submitting : labels.submit}
        </button>
      </form>
    </div>
  );
}
