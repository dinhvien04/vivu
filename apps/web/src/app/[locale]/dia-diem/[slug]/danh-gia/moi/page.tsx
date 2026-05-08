'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { createReview } from '@/lib/reviews-client';

interface PageProps {
  params: { slug: string };
}

export default function WriteReviewPage({ params }: PageProps) {
  const router = useRouter();
  const { user, loading, getAccessToken } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      const next = `/dia-diem/${params.slug}/danh-gia/moi`;
      router.replace(`/dang-nhap?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, router, params.slug]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao từ 1–5.');
      return;
    }
    if (content.trim().length < 5) {
      setError('Nội dung tối thiểu 5 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Phiên đăng nhập đã hết hạn');
      await createReview(params.slug, { rating, content: content.trim() }, token);
      router.push(`/dia-diem/${params.slug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-container/30">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-6 py-10 md:px-10">
        <Link
          href={`/dia-diem/${params.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
        >
          <Icon name="arrow_back" className="!text-base" />
          Về trang địa điểm
        </Link>
        <div className="mx-auto max-w-2xl rounded-2xl border border-outline-variant/40 bg-surface p-8 shadow-sm">
          <h1 className="font-h2 text-h2 text-on-surface">Viết đánh giá</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Chia sẻ trải nghiệm thực tế của bạn về địa điểm này. Đánh giá của bạn sẽ hiển thị công
            khai sau khi gửi.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Số sao
              </span>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="rounded p-1 transition-transform hover:scale-110"
                    aria-label={`${i} sao`}
                  >
                    <Icon
                      name={i <= rating ? 'star' : 'star_border'}
                      className={`!text-3xl ${i <= rating ? 'text-secondary' : 'text-outline'}`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-body-md text-on-surface-variant">{rating}/5</span>
              </div>
            </div>

            <label className="block">
              <span className="text-overline uppercase tracking-overline text-on-surface-variant">
                Nội dung
              </span>
              <textarea
                rows={8}
                required
                minLength={5}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn cảm nhận như thế nào về địa điểm này? Có gì đáng nhớ, có gì cần lưu ý..."
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container/40 p-3 text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
              <span className="mt-1 block text-body-sm text-outline">
                Tối thiểu 5 ký tự, tối đa 2000.
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-sm text-on-error-container"
              >
                {error}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href={`/dia-diem/${params.slug}`}
                className="rounded-lg border border-outline-variant px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                <Icon name="send" className="!text-base" />
                {submitting ? 'Đang gửi…' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
