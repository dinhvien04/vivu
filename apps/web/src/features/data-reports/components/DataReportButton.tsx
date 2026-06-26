'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Icon } from '@/components/icon';
import { TurnstileWidget } from '@/components/turnstile-widget';
import type { Locale } from '@/i18n/routing';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { createDataReport } from '@/lib/data-reports-client';
import type { DataReportType } from '@vivu/types';

interface DataReportButtonProps {
  placeSlug: string;
  placeTitle: string;
}

const TYPES: Array<{ value: DataReportType; vi: string; en: string }> = [
  { value: 'wrong_image', vi: 'Sai hình ảnh', en: 'Wrong image' },
  { value: 'wrong_coordinates', vi: 'Sai tọa độ', en: 'Wrong coordinates' },
  { value: 'wrong_description', vi: 'Sai mô tả', en: 'Wrong description' },
  { value: 'missing_info', vi: 'Thiếu thông tin', en: 'Missing info' },
  { value: 'other', vi: 'Khác', en: 'Other' },
];
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const REPORT_MESSAGE_MAX_LENGTH = 1000;

function text(locale: Locale) {
  const vi = locale !== 'en';
  return {
    button: vi ? 'Báo lỗi thông tin' : 'Report data issue',
    title: vi ? 'Báo lỗi thông tin' : 'Report data issue',
    lead: vi
      ? 'Nói cho Vivu biết thông tin nào cần sửa. Báo cáo này chỉ gửi về admin.'
      : 'Tell Vivu what should be corrected. This report goes to admin only.',
    type: vi ? 'Loại lỗi' : 'Issue type',
    message: vi ? 'Mô tả ngắn' : 'Short description',
    contact: vi ? 'Liên hệ nếu cần' : 'Contact if needed',
    cancel: vi ? 'Hủy' : 'Cancel',
    submit: vi ? 'Gửi báo lỗi' : 'Submit report',
    sending: vi ? 'Đang gửi...' : 'Sending...',
    success: vi ? 'Đã gửi báo lỗi, cảm ơn bạn.' : 'Report sent. Thank you.',
    error: vi ? 'Không gửi được báo lỗi. Vui lòng thử lại.' : 'Could not submit report.',
  };
}

function label(locale: Locale, item: { vi: string; en: string }) {
  return locale === 'en' ? item.en : item.vi;
}

export function DataReportButton({ placeSlug, placeTitle }: DataReportButtonProps) {
  const locale = useLocale() as Locale;
  const labels = text(locale);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DataReportType>('wrong_description');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    if (loading || message.trim().length < 5) return;
    setLoading(true);
    setStatus(null);
    try {
      await createDataReport({
        placeSlug,
        type,
        message: message.trim(),
        contact: contact.trim() || undefined,
        website,
        turnstileToken: turnstileToken || undefined,
      });
      void trackAnalyticsEvent('detail_report_clicked', {
        placeSlug,
        metadata: { action: 'submitted', type },
      });
      setStatus(labels.success);
      setMessage('');
      setContact('');
      setTurnstileToken('');
      setTurnstileResetKey((value) => value + 1);
      window.setTimeout(() => setOpen(false), 900);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : labels.error;
      if (errMsg.includes('expired') || errMsg.includes('timeout-or-duplicate') || errMsg.includes('Turnstile') || errMsg.includes('token')) {
        setStatus(locale === 'en' ? 'Verification session expired. Please verify again.' : 'Phiên xác minh đã hết hạn. Vui lòng xác minh lại.');
      } else {
        setStatus(errMsg);
      }
      setTurnstileToken('');
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void trackAnalyticsEvent('detail_report_clicked', {
            placeSlug,
            metadata: { action: 'open' },
          });
          setOpen(true);
          setStatus(null);
        }}
        className="flex w-full items-center justify-center gap-2 py-2 text-body-sm font-medium text-on-surface-variant transition hover:text-primary"
      >
        <Icon name="report" className="!text-base" />
        <span>{labels.button}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-overline uppercase tracking-overline text-primary">
                  {placeTitle}
                </p>
                <h2 className="mt-1 font-h3 text-h3 text-on-surface">{labels.title}</h2>
                <p className="mt-2 text-body-sm text-on-surface-variant">{labels.lead}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">{labels.type}</span>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as DataReportType)}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {label(locale, item)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">
                  {labels.message}
                </span>
                <textarea
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  maxLength={REPORT_MESSAGE_MAX_LENGTH}
                  className="mt-2 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="mt-1 block text-right text-xs text-on-surface-variant">
                  {message.length}/{REPORT_MESSAGE_MAX_LENGTH}
                </span>
              </label>

              <label className="block">
                <span className="text-label-md font-semibold text-on-surface">
                  {labels.contact}
                </span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  maxLength={254}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onToken={setTurnstileToken}
                resetKey={turnstileResetKey}
              />

              <label className="sr-only">
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
            </div>

            {status && (
              <p className="mt-4 rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface-variant">
                {status}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-outline-variant px-4 py-2 font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading || message.trim().length < 5}
                className="rounded-full bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? labels.sending : labels.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
