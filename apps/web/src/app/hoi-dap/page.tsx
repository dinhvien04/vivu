'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { listQuestions } from '@/lib/qa-client';
import type { Paginated, Question } from '@vivu/types';

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

export default function HoiDapListPage() {
  const [page, setPage] = useState<Paginated<Question> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listQuestions({ pageSize: 30 });
        if (!cancelled) setPage(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          setPage({ data: [], meta: { page: 1, pageSize: 30, total: 0 } });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-overline uppercase tracking-overline text-secondary">Cộng đồng</p>
            <h1 className="mt-2 font-h1 text-h1 text-on-surface">Hỏi đáp</h1>
            <p className="mt-3 font-sans text-body-lg text-on-surface-variant">
              Đặt câu hỏi về địa điểm bạn muốn ghé thăm và nhận câu trả lời từ những người đã đi
              trước.
            </p>
          </div>
          <Link
            href="/kham-pha"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Icon name="explore" className="!text-base" />
            Tìm địa điểm để hỏi
          </Link>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
          >
            {error}
          </div>
        )}

        {page === null ? (
          <ul className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-surface-container"
                aria-hidden
              />
            ))}
          </ul>
        ) : page.data.length === 0 ? (
          <EmptyState
            icon="forum"
            title="Chưa có câu hỏi nào"
            description="Bạn có thể đặt câu hỏi đầu tiên trên trang chi tiết của bất kỳ địa điểm nào."
            action={{ label: 'Khám phá địa điểm', href: '/kham-pha' }}
          />
        ) : (
          <>
            <p className="mb-4 text-body-sm text-on-surface-variant">
              {page.meta.total} câu hỏi từ cộng đồng
            </p>
            <ul className="space-y-4">
              {page.data.map((q) => (
                <li
                  key={q.id}
                  className="rounded-2xl border border-outline-variant bg-surface px-5 py-5 transition-all hover:border-primary/40 hover:shadow-premium"
                >
                  <Link href={`/hoi-dap/${q.id}`} className="block">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
                      {q.place && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
                          <Icon name="place" className="!text-sm" />
                          {q.place.titleVi}
                        </span>
                      )}
                      <span>•</span>
                      <span>{q.user.name}</span>
                      <span>•</span>
                      <span>{formatRelative(q.createdAt)}</span>
                    </div>
                    <p className="font-h3 text-h3 text-on-surface line-clamp-3 group-hover:text-primary">
                      {q.content}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-label-md text-secondary">
                      <Icon name="comment" className="!text-base" />
                      {q.answersCount} câu trả lời
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
