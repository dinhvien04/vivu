'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { createQuestion } from '@/lib/qa-client';
import type { Question } from '@vivu/types';

interface Props {
  placeSlug: string;
  initialQuestions: Question[];
  initialTotal: number;
}

function useFormatRelative() {
  const t = useTranslations('qaSection');
  return (iso: string): string => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return t('justNow');
    if (min < 60) return t('minutesAgo', { count: min });
    const h = Math.floor(min / 60);
    if (h < 24) return t('hoursAgo', { count: h });
    const day = Math.floor(h / 24);
    if (day < 30) return t('daysAgo', { count: day });
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
}

export function QaSection({ placeSlug, initialQuestions, initialTotal }: Props) {
  const t = useTranslations('qaSection');
  const formatRelative = useFormatRelative();
  const { user, getAccessToken } = useAuth();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [total, setTotal] = useState(initialTotal);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 5) {
      setError(t('tooShort'));
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('signInRequired'));
      const created = await createQuestion(placeSlug, content.trim(), token);
      setQuestions((qs) => [created, ...qs]);
      setTotal((n) => n + 1);
      setContent('');
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-h2 text-h2 text-on-surface">
          {t('title')}
          {total > 0 && (
            <span className="ml-2 text-body-md font-normal text-on-surface-variant">
              {t('totalSuffix', { total })}
            </span>
          )}
        </h2>
        {user ? (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary min-h-[44px] px-5 py-2 text-label-md font-bold text-primary transition-all hover:bg-primary-container hover:scale-[1.02]"
          >
            <Icon name={showForm ? 'close' : 'help_outline'} className="!text-base" />
            {showForm ? t('cancelBtn') : t('askBtn')}
          </button>
        ) : (
          <Link
            href={`/dang-nhap?next=/dia-diem/${placeSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary min-h-[44px] px-5 py-2 text-label-md font-bold text-primary transition-all hover:bg-primary-container hover:scale-[1.02]"
          >
            <Icon name="login" className="!text-base" />
            {t('signInBtn')}
          </Link>
        )}
      </div>

      {showForm && user && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-card"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t('placeholder')}
            className="w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-label-caps text-on-surface-variant font-medium">{content.trim().length}/1000</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary min-h-[44px] px-6 py-2.5 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="send" className="!text-base" />
              {submitting ? t('submittingBtn') : t('submitBtn')}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <EmptyState compact icon="forum" title={t('emptyTitle')} description={t('emptyLead')} />
      ) : (
        <ul className="space-y-3">
          {questions.slice(0, 5).map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
            >
              <Link href={`/hoi-dap/${q.id}`} className="block">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{q.user.name}</span>
                  <span>•</span>
                  <span>{formatRelative(q.createdAt)}</span>
                </div>
                <p className="font-sans text-body-md text-on-surface line-clamp-2 leading-relaxed">{q.content}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-label-md text-secondary font-bold">
                  <Icon name="comment" className="!text-base" />
                  {t('answersCount', { count: q.answersCount })}
                </p>
              </Link>
            </li>
          ))}
          {questions.length > 5 && (
            <li>
              <Link
                href={`/hoi-dap?placeSlug=${placeSlug}`}
                className="inline-flex items-center gap-1 text-label-md font-bold text-primary hover:underline min-h-[36px]"
              >
                {t('viewAll', { total })}
                <Icon name="arrow_forward" className="!text-base" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
