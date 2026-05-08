'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { createQuestion } from '@/lib/qa-client';
import type { Question } from '@vivu/types';

interface Props {
  placeSlug: string;
  initialQuestions: Question[];
  initialTotal: number;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function QaSection({ placeSlug, initialQuestions, initialTotal }: Props) {
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
      setError('Câu hỏi cần ít nhất 5 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Vui lòng đăng nhập');
      const created = await createQuestion(placeSlug, content.trim(), token);
      setQuestions((qs) => [created, ...qs]);
      setTotal((t) => t + 1);
      setContent('');
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-h2 text-h2 text-on-surface">
          Hỏi đáp
          {total > 0 && (
            <span className="ml-2 text-body-md font-normal text-on-surface-variant">
              ({total} câu hỏi)
            </span>
          )}
        </h2>
        {user ? (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-label-md font-semibold text-primary transition-colors hover:bg-primary-container"
          >
            <Icon name={showForm ? 'close' : 'help_outline'} className="!text-base" />
            {showForm ? 'Huỷ' : 'Đặt câu hỏi'}
          </button>
        ) : (
          <Link
            href={`/dang-nhap?next=/dia-diem/${placeSlug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-label-md font-semibold text-primary transition-colors hover:bg-primary-container"
          >
            <Icon name="login" className="!text-base" />
            Đăng nhập để hỏi
          </Link>
        )}
      </div>

      {showForm && user && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-outline-variant bg-surface px-5 py-5"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Bạn muốn hỏi gì về địa điểm này? (5–1000 ký tự)"
            className="w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-label-caps text-on-surface-variant">{content.trim().length}/1000</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="send" className="!text-base" />
              {submitting ? 'Đang gửi…' : 'Gửi câu hỏi'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <EmptyState
          compact
          icon="forum"
          title="Chưa có câu hỏi"
          description="Bạn đang phân vân điều gì? Đặt câu hỏi để cộng đồng cùng giải đáp."
        />
      ) : (
        <ul className="space-y-3">
          {questions.slice(0, 5).map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-outline-variant bg-surface px-5 py-4 transition-all hover:border-primary/40"
            >
              <Link href={`/hoi-dap/${q.id}`} className="block">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                  <span className="font-medium text-on-surface">{q.user.name}</span>
                  <span>•</span>
                  <span>{formatRelative(q.createdAt)}</span>
                </div>
                <p className="font-sans text-body-md text-on-surface line-clamp-2">{q.content}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-label-md text-secondary">
                  <Icon name="comment" className="!text-base" />
                  {q.answersCount} câu trả lời
                </p>
              </Link>
            </li>
          ))}
          {questions.length > 5 && (
            <li>
              <Link
                href={`/hoi-dap?placeSlug=${placeSlug}`}
                className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline"
              >
                Xem tất cả {total} câu hỏi
                <Icon name="arrow_forward" className="!text-base" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
