import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { SUPPORT_EMAIL, HOTLINE_NUMBER } from '@/lib/support';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Contact Us · Vivu' : 'Liên hệ · Vivu',
    description: isEn
      ? 'Get in touch with the Vivu team for support or consulting.'
      : 'Liên hệ với đội ngũ phát triển Vivu để được hỗ trợ và tư vấn du lịch Gia Lai.',
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === 'en';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-margin-mobile py-section-gap md:px-margin-desktop">
        {isEn ? (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Contact Us</h1>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Have questions, feedback, or need detailed support? The Vivu team is here to help!
            </p>

            <div className="grid gap-6 sm:grid-cols-2 mb-10">
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="email" className="text-primary" />
                  <h3 className="font-bold text-on-surface m-0">Email Support</h3>
                </div>
                <p className="text-body-md text-on-surface-variant m-0">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="chat" className="text-primary" />
                  <h3 className="font-bold text-on-surface m-0">Zalo Hotline</h3>
                </div>
                <p className="text-body-md text-on-surface-variant m-0">{HOTLINE_NUMBER}</p>
              </div>
            </div>

            <div className="rounded-xl bg-primary-container p-6 text-on-primary-container mb-8">
              <h2 className="text-xl font-bold mt-0 mb-3 flex items-center gap-2">
                <Icon name="support_agent" /> Need a tailored trip plan?
              </h2>
              <p className="mb-4">
                Our local experts can help design the perfect Gia Lai adventure for you. Submit a
                request through our consulting board.
              </p>
              <Link
                href="/tu-van?source=contact"
                className="inline-flex items-center rounded-lg bg-primary px-5 py-3 font-bold text-on-primary hover:bg-primary/90 transition-colors"
              >
                Go to Consulting Form
              </Link>
            </div>
          </article>
        ) : (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Liên hệ với chúng tôi</h1>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Bạn có thắc mắc, đóng góp ý kiến hoặc cần hỗ trợ thông tin du lịch Gia Lai? Hãy kết
              nối với đội ngũ phát triển Vivu!
            </p>

            <div className="grid gap-6 sm:grid-cols-2 mb-10">
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="email" className="text-primary" />
                  <h3 className="font-bold text-on-surface m-0">Gửi Email hỗ trợ</h3>
                </div>
                <p className="text-body-md text-on-surface-variant m-0">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>

              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="chat" className="text-primary" />
                  <h3 className="font-bold text-on-surface m-0">Kênh Zalo</h3>
                </div>
                <p className="text-body-md text-on-surface-variant m-0">{HOTLINE_NUMBER}</p>
              </div>
            </div>

            <div className="rounded-xl bg-primary-container p-6 text-on-primary-container mb-8">
              <h2 className="text-xl font-bold mt-0 mb-3 flex items-center gap-2">
                <Icon name="support_agent" /> Bạn cần thiết kế chuyến đi riêng?
              </h2>
              <p className="mb-4">
                Đội ngũ của chúng tôi luôn sẵn lòng tư vấn miễn phí và thiết kế hành trình du lịch
                Gia Lai độc bản dành riêng cho bạn.
              </p>
              <Link
                href="/tu-van?source=contact"
                className="inline-flex items-center rounded-lg bg-primary px-5 py-3 font-bold text-on-primary hover:bg-primary/90 transition-colors"
              >
                Gửi yêu cầu Tư vấn ngay
              </Link>
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
