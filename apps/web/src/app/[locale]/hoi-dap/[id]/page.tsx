'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { createAnswer, deleteAnswer, deleteQuestion, getQuestion } from '@/lib/qa-client';
import type { Question } from '@vivu/types';

function formatDateTime(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HoiDapDetailPage() {
  const t = useTranslations('qa');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuestion(id);
        if (!cancelled) setQuestion(data);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : t('errorGeneric');
        if (/Không tìm thấy|Not found|404/i.test(msg)) setNotFound(true);
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const handleAnswer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (answerContent.trim().length < 5) {
      setError(t('errorAnswerTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('loginRequired'));
      const created = await createAnswer(id, answerContent.trim(), token);
      setQuestion((q) =>
        q
          ? {
              ...q,
              answersCount: q.answersCount + 1,
              answers: [...(q.answers ?? []), created],
            }
          : q,
      );
      setAnswerContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string): Promise<void> => {
    if (!window.confirm(t('confirmDeleteAnswer'))) return;
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('loginRequired'));
      await deleteAnswer(answerId, token);
      setQuestion((q) =>
        q
          ? {
              ...q,
              answersCount: Math.max(0, q.answersCount - 1),
              answers: (q.answers ?? []).filter((a) => a.id !== answerId),
            }
          : q,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
    }
  };

  const handleDeleteQuestion = async (): Promise<void> => {
    if (!window.confirm(t('confirmDeleteQuestion'))) return;
    setDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(t('loginRequired'));
      await deleteQuestion(id, token);
      router.push(`/${locale}/hoi-dap`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <div className="rounded-2xl border border-outline-variant bg-surface px-6 py-12 text-center">
            <Icon name="help_outline" className="!text-5xl text-on-surface-variant" />
            <h1 className="mt-4 font-h2 text-h2 text-on-surface">{t('notFoundTitle')}</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">{t('notFoundDescription')}</p>
            <Link
              href="/hoi-dap"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Icon name="arrow_back" className="!text-base" />
              {t('backToList')}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!question) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-surface-container" aria-hidden />
            <div className="h-24 animate-pulse rounded-2xl bg-surface-container" aria-hidden />
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const isOwner = user && user.id === question.user.id;
  const answers = question.answers ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <nav aria-label="Breadcrumb" className="mb-6 text-label-md text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-primary">
                {tCommon('home')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/hoi-dap" className="hover:text-primary">
                {t('listTitle')}
              </Link>
            </li>
            {question.place && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/dia-diem/${question.place.slug}`} className="hover:text-primary">
                    {placeTitle(question.place, locale)}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        <article className="rounded-2xl border border-outline-variant bg-surface px-6 py-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
            {question.place && (
              <Link
                href={`/dia-diem/${question.place.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container hover:bg-primary/20"
              >
                <Icon name="place" className="!text-sm" />
                {placeTitle(question.place, locale)}
              </Link>
            )}
            <span>•</span>
            <span className="font-medium text-on-surface">{question.user.name}</span>
            <span>•</span>
            <span>{formatDateTime(question.createdAt, locale)}</span>
          </div>
          <h1 className="font-h1 text-h2 text-on-surface whitespace-pre-line">
            {question.content}
          </h1>
          {isOwner && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDeleteQuestion}
                disabled={deleting}
                className="inline-flex items-center gap-1 rounded-lg border border-error/40 px-3 py-1.5 text-label-md text-error hover:bg-error-container disabled:opacity-50"
              >
                <Icon name="delete" className="!text-base" />
                {deleting ? t('deletingQuestion') : t('deleteQuestion')}
              </button>
            </div>
          )}
        </article>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-4 font-h2 text-h2 text-on-surface">
            {t('answersCount', { count: question.answersCount })}
          </h2>
          {answers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant bg-surface-container px-6 py-8 text-center text-body-md text-on-surface-variant">
              {t('answersEmpty')}
            </p>
          ) : (
            <ul className="space-y-4">
              {answers.map((a) => {
                const isAnswerOwner = user && user.id === a.user.id;
                return (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-outline-variant bg-surface px-5 py-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-label-caps text-on-surface-variant">
                        <span className="font-medium text-on-surface">{a.user.name}</span>
                        <span>•</span>
                        <span>{formatDateTime(a.createdAt, locale)}</span>
                      </div>
                      {isAnswerOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnswer(a.id)}
                          aria-label={t('deleteAnswer')}
                          className="rounded-full p-1 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                        >
                          <Icon name="delete" className="!text-base" />
                        </button>
                      )}
                    </div>
                    <p className="font-sans text-body-md text-on-surface whitespace-pre-line">
                      {a.content}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-outline-variant bg-surface px-6 py-5">
          <h2 className="mb-3 font-h3 text-h3 text-on-surface">{t('answerComposerTitle')}</h2>
          {!user ? (
            <p className="text-body-md text-on-surface-variant">
              <Link
                href={`/dang-nhap?next=/hoi-dap/${id}`}
                className="font-semibold text-primary hover:underline"
              >
                {t('login')}
              </Link>{' '}
              {t('answerLoginSuffix')}
            </p>
          ) : (
            <form onSubmit={handleAnswer} className="space-y-3">
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t('answerComposerPlaceholder')}
                className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="send" className="!text-base" />
                {submitting ? t('submitting') : t('submitAnswer')}
              </button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
