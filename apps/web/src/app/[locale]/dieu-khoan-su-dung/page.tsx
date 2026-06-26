import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import type { Locale } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Terms of Use · Vivu' : 'Điều khoản sử dụng · Vivu',
    description: isEn
      ? 'Terms of use and disclaimer policy for Vivu.'
      : 'Các điều khoản sử dụng dịch vụ và chính sách miễn trừ trách nhiệm tại Vivu.',
  };
}

export default async function TermsOfUsePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === 'en';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-margin-mobile py-section-gap md:px-margin-desktop">
        {isEn ? (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Terms of Use</h1>
            <p className="text-body-lg text-on-surface-variant mb-6">Last updated: June 25, 2026</p>
            <p>
              Welcome to Vivu. By accessing or using our website, you agree to comply with and be
              bound by the following Terms of Use.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">1. Travel Reference Tool</h2>
            <p>
              Vivu is an informational search and AI assistant tool to help users plan trips to Gia
              Lai. The content and AI recommendations provided are for reference purposes only.
            </p>
            <p>
              <strong>AI content accuracy warning:</strong> AI-generated plans may contain
              inaccuracies, missing details, or outdated information. Users should independently
              verify details (such as operating hours, route safety, and costs) before traveling. AI
              trip itineraries do not replace professional tour guides or official agency
              recommendations.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">
              2. Permitted Use & Prohibitions
            </h2>
            <p>Users agree to use Vivu responsibly. You are strictly prohibited from:</p>
            <ul>
              <li>Spamming, attacking, scraping, or abusing platform APIs or database systems.</li>
              <li>
                Attempting to bypass safety filters or perform prompt injection attacks on the AI
                Chat widget.
              </li>
              <li>
                Uploading or transmitting illegal, offensive, harmful, or copyright-infringing
                content.
              </li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">
              3. Availability & Service Suspension
            </h2>
            <p>
              Vivu reserves the right to suspend or restrict access to features (such as AI Chat or
              Trip Planner) at any time, without prior notice, for system maintenance, quota
              control, or suspected user abuse.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">
              4. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Vivu shall not be liable for any direct,
              indirect, incidental, or consequential damages resulting from your reliance on
              information or travel recommendations generated on our platform.
            </p>
          </article>
        ) : (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Điều khoản sử dụng</h1>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Cập nhật lần cuối: 25 tháng 6, 2026
            </p>
            <p>
              Chào mừng bạn đến với Vivu. Bằng việc truy cập và sử dụng trang web của chúng tôi, bạn
              đồng ý tuân thủ và ràng buộc bởi các điều khoản sử dụng dưới đây.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">
              1. Công cụ hỗ trợ tham khảo du lịch
            </h2>
            <p>
              Vivu cung cấp thông tin tra cứu địa điểm và lên lịch trình tự động bằng trí tuệ nhân
              tạo (AI) cho các chuyến du lịch tại Gia Lai. Tất cả thông tin chỉ mang tính chất tham
              khảo.
            </p>
            <p>
              <strong>Khuyến cáo tính chính xác của AI:</strong> Các thông tin do AI gợi ý có thể
              chưa hoàn toàn chính xác hoặc bị thiếu sót. Người dùng vui lòng tự kiểm tra lại thực
              tế (như giờ mở cửa, chất lượng đường sá, giá vé) trước khi đi. Lịch trình tham khảo
              không thay thế cho các tư vấn chuyên nghiệp từ công ty lữ hành hoặc cơ quan du lịch
              chính thống.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">2. Hành vi bị nghiêm cấm</h2>
            <p>Khi sử dụng Vivu, bạn cam kết không thực hiện các hành vi sau:</p>
            <ul>
              <li>
                Spam, tấn công từ chối dịch vụ (DDoS), thu thập dữ liệu trái phép hoặc lạm dụng tài
                nguyên API hệ thống.
              </li>
              <li>
                Sử dụng các kỹ thuật tấn công prompt injection hoặc phá hoại bộ lọc an toàn của AI
                Chat.
              </li>
              <li>
                Gửi hoặc đăng tải thông tin, tệp tin vi phạm pháp luật, thuần phong mỹ tục hoặc bản
                quyền sở hữu trí tuệ.
              </li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">3. Tạm ngưng dịch vụ</h2>
            <p>
              Vivu có quyền tạm ngừng cung cấp tính năng (như AI Chat, Lên lịch trình) hoặc giới hạn
              lượt truy cập của người dùng mà không cần báo trước để bảo trì hệ thống hoặc phòng
              chống lạm dụng phá hoại.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">4. Giới hạn trách nhiệm</h2>
            <p>
              Vivu miễn trừ mọi trách nhiệm pháp lý đối với bất kỳ rủi ro, tổn thất hoặc thiệt hại
              trực tiếp/gián tiếp nào xảy ra đối với hành trình du lịch thực tế của bạn khi tham
              khảo thông tin từ hệ thống của chúng tôi.
            </p>
          </article>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
