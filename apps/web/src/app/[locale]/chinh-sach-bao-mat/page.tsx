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
    title: isEn ? 'Privacy Policy · Vivu' : 'Chính sách bảo mật · Vivu',
    description: isEn
      ? 'Privacy policy and data protection terms for Vivu users.'
      : 'Chính sách bảo mật thông tin và bảo vệ dữ liệu người dùng tại Vivu.',
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === 'en';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-margin-mobile py-section-gap md:px-margin-desktop">
        {isEn ? (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Privacy Policy</h1>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Last updated: June 25, 2026
            </p>
            <p>
              Vivu is committed to protecting your privacy and handling your personal data with the highest standard of security. This Privacy Policy describes how we collect, use, and process your information when you use our service.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect the following information when you interact with our platform:</p>
            <ul>
              <li><strong>Personal Details:</strong> Full name, phone number, Zalo account, or email address when submitted via forms.</li>
              <li><strong>Travel Preferences:</strong> Destinational interests, trip requirements, or itineraries generated.</li>
              <li><strong>Interactions:</strong> Feedback, bug reports, and usage metrics (via basic analytics).</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">2. Purpose of Processing</h2>
            <p>Your data is processed strictly for the following purposes:</p>
            <ul>
              <li>To provide customized travel consulting and planning services.</li>
              <li>To improve tourist attraction data and verify data accuracy.</li>
              <li>To prevent abuse, spam, and secure platform APIs (e.g. Turnstile validation).</li>
              <li>To optimize our AI recommendation algorithms and user interface.</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">3. Data Sharing & Infrastructure</h2>
            <p>
              We value your privacy. <strong>We do not sell your personal data</strong> and we never publish your email or phone number. Access to your personal data is restricted to authorized administrative staff and coordinators responsible for consulting.
            </p>
            <p>
              For infrastructure operations, data may flow through our hosting and service subprocessors, including:
            </p>
            <ul>
              <li><strong>Vercel:</strong> Web hosting and routing.</li>
              <li><strong>Neon:</strong> Database storage.</li>
              <li><strong>AWS S3:</strong> Media and asset storage.</li>
              <li><strong>Qdrant & Gemini:</strong> Vector search index and AI response generation.</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">4. Data Deletion & Requests</h2>
            <p>
              You have the right to request deletion or modification of your personal data at any time. To request deletion, please contact us at <a href="mailto:support@vivu.vn">support@vivu.vn</a> (Placeholder - TODO: configure official support inbox).
            </p>
          </article>
        ) : (
          <article className="prose prose-slate max-w-none">
            <h1 className="font-h1 text-h1 text-on-surface mb-6">Chính sách bảo mật</h1>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Cập nhật lần cuối: 25 tháng 6, 2026
            </p>
            <p>
              Vivu cam kết bảo vệ thông tin riêng tư và xử lý dữ liệu cá nhân của bạn một cách an toàn nhất. Chính sách bảo mật này mô tả cách thức chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn sử dụng dịch vụ của Vivu.
            </p>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">1. Thông tin thu thập</h2>
            <p>Chúng tôi có thể thu thập các thông tin sau khi bạn tương tác trên hệ thống:</p>
            <ul>
              <li><strong>Thông tin cá nhân:</strong> Họ tên, số điện thoại, tài khoản Zalo, hoặc địa chỉ email do bạn nhập qua các biểu mẫu.</li>
              <li><strong>Nhu cầu chuyến đi:</strong> Điểm đến mong muốn, hành trình tự tạo, hoặc yêu cầu tư vấn cụ thể.</li>
              <li><strong>Dữ liệu phản hồi:</strong> Đóng góp ý kiến, báo lỗi dữ liệu địa danh hoặc phản hồi về chất lượng dịch vụ.</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">2. Mục đích sử dụng</h2>
            <p>Dữ liệu của bạn được sử dụng cho các mục đích cụ thể sau:</p>
            <ul>
              <li>Hỗ trợ tư vấn chuyến đi và gợi ý hành trình du lịch phù hợp.</li>
              <li>Cải thiện dữ liệu địa danh và tối ưu hóa hệ thống gợi ý.</li>
              <li>Phát hiện chống spam, lạm dụng hệ thống (qua xác thực Turnstile).</li>
              <li>Nâng cao chất lượng AI và trải nghiệm người dùng (UX).</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">3. Truy cập và chia sẻ thông tin</h2>
            <p>
              Chúng tôi tôn trọng quyền riêng tư của bạn. <strong>Vivu không bán dữ liệu cá nhân của bạn</strong> và tuyệt đối không công khai số điện thoại hoặc email. Chỉ những admin được phân quyền và nhân sự phụ trách tư vấn mới được tiếp cận thông tin này.
            </p>
            <p>
              Để vận hành hệ thống, dữ liệu có thể đi qua các nhà cung cấp hạ tầng tin cậy theo cấu hình hệ thống:
            </p>
            <ul>
              <li><strong>Vercel:</strong> Lưu trữ web và định tuyến.</li>
              <li><strong>Neon:</strong> Lưu trữ cơ sở dữ liệu PostgreSQL.</li>
              <li><strong>AWS S3:</strong> Lưu trữ hình ảnh và tệp phương tiện.</li>
              <li><strong>Qdrant & Gemini:</strong> Tìm kiếm ngữ nghĩa và tạo lịch trình tự động bằng AI.</li>
            </ul>

            <h2 className="font-h2 text-h2 text-on-surface mt-8 mb-4">4. Quyền chỉnh sửa và xóa dữ liệu</h2>
            <p>
              Bạn có quyền yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân của mình khỏi cơ sở dữ liệu của Vivu bất kỳ lúc nào. Vui lòng gửi yêu cầu về email <a href="mailto:support@vivu.vn">support@vivu.vn</a> (TODO: cấu hình hòm thư hỗ trợ chính thức).
            </p>
          </article>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
