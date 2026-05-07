/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAwaZ0BhaWfCpjlhSDOMbezOXKT2O_4eEQK_l61RPuiGABVVGPijN5f2tXDS0oD8Zc55DBhnvZMaN39I8uI6xLoESvG26-5BY5VQJMo_4e11VufVCjO-6Jt3Yux_G_4-FXiqVgcWM-Nf3pcmsmPimgMAOdJQ7PjqfRWTOa4rTUQ9SdddTLVX8k0TzbZ-y30dB24zU5rh3-2s8dks6Yfwiu3efrbprbNGhhXe2m52rCnBcQxEtI3o8v_aM_jjH3J8VNmfYrS4--VMHgY';

const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC86tYWLpX2D_OQK0fLQtBD6hI2_h9dc82S4RQZdDRB6LEtN4fC0NzZYECxZYusDPmAutGWibufWekEYziZ0j4Zd-I4KSKSvfh7pTGKCZ5PjCpObCd01EADupOKgFpCcnJ4aylh1dNO7l_UTHuXe6ldq7aXG-7HR57yF-Hvs5OxMiQzsNzWIeZfuvK-ZLetHkyeK9vXqkFzIwSaGaXDySAfoqntAw2DQSxU3qFk3u-WRCM2KNJjo0rnvZAh8SDbjUuTbzGQQm0-DLhS';

const COLLECTIONS = [
  {
    region: 'MIỀN BẮC',
    title: 'Vịnh Hạ Long: Kỳ quan thế giới',
    href: '/dia-diem/vinh-ha-long',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB66G7dUE2E3o6OgyNEqiXkykjAhI4jOPSJk7QMDUWQNdD5fyykhIGh7q-bwkhU3fQb7z23uYfN0tPLCoyA9G_0jvOXeEnb1OC-zEkkWRd-X87pvoEdfFQsXTv3W6AypANebz4lDUfyN2DKedd_iARPfL-j_pyxMiSDztP7wszCmZcrTMpDaFeCFakoo4AI_oUMeLUU57FcURUPZLqDFdFucg3TQgd4liGnikHysN4nMXKbFn_MAuqTnWBRTMJZHPUQUa41JyQ_NlHB',
    alt: 'Vịnh Hạ Long lúc hoàng hôn',
  },
  {
    region: 'MIỀN TRUNG',
    title: 'Hội An: Phố cổ đèn lồng',
    href: '/dia-diem/pho-co-hoi-an',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAf3iucRPjsC1Dr3Z63IlZyYduut1SfkeXlmuz1yPQmSqClo0Rbt-ClZCQa9KzjPBNlx3903oXDem1b2-EqpBGRhWlXn-tNbBFSvPSG7TRDa2ZRqngx_jp0o1h6HZ6EuIynjeHJI048X5VMrXdPSMS_tZCaxEbGM9KDzjHQZZSLoh1su7aT-uy7K6kDr85wk1QVkVSezDXRlpK8nTzeAJrx7S3hke9ThrHA0zzsTV4PZibtm6R_J6cJUYvH4Vt91ENyeEnMpUvyxoRr',
    alt: 'Hội An đèn lồng đêm',
  },
  {
    region: 'MIỀN NAM',
    title: 'Sài Gòn: Nhịp sống hiện đại',
    href: '/dia-diem/sai-gon-ben-thanh',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjTwzsOLF8uUwqq8qoCJR_ef4P1_avnxbuZozP9DdRp879-7k1G7NkbLCexO9FQVE_ErF5nTiDnkzk-kb8QeGSHfNjLw3kZO0dSE05ORXwy1G3gXvyeT53b8kN8cYiNESBK-FyKj-aUSK3y3COchGsP81sQs7iv8OkE5Qf3rTAh81BVCHbN1TLOuq-WT0up0sZLDnynb_esLadRGE_s0ddsivXtbEZx75N5D8_F9ss-dEfpUI2AqEAuuagIWnYeRmkSYGwH5KpYIC9',
    alt: 'Skyline Sài Gòn lúc bình minh',
  },
  {
    region: 'TÂY NGUYÊN',
    title: 'Đà Lạt: Thành phố ngàn hoa',
    href: '/dia-diem/da-lat',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ1xOUZNQCDdgRxYUDzveKWknPR7hABCTdMm0nPCAaKowzJYv2Yu_ssF1qkeovUbBxSmn2FAcdvbGlWj5eBp-1EL8kCNLJTDYi1NzObKx1iGhvaMhols28X6UW7gQUNqE5luLvNtIuxgzGUrmPUnkkDhtj8EN0wZ-jCgf92JPhW9jJZVGH0sJBG_3t-8wosQGKorynao9_bs13kdZtDv_Tlv1anbjR-xyOF539F7TVXedJvxNu4mRXZwnJA-cBrTMi6KP8jtNmubNd',
    alt: 'Đồi chè Đà Lạt sương sớm',
  },
];

const SEARCH_FILTERS = [
  { icon: 'location_on', label: 'Vùng miền: Miền Trung' },
  { icon: 'category', label: 'Chủ đề: Biển đảo' },
  { icon: 'calendar_month', label: 'Mùa: Mùa Hè' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        {/* Hero */}
        <section className="flex flex-col items-center gap-12 py-section-gap md:flex-row">
          <div className="flex-1 space-y-6">
            <h1 className="font-h1 text-h1 text-on-surface">Vivu · Du lịch Việt Nam</h1>
            <p className="max-w-2xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
              Portal tra cứu địa điểm du lịch: khám phá theo vùng miền, chủ đề và mùa, kèm bản đồ
              tương tác và đánh giá cộng đồng. Không bán tour, không đặt phòng — chỉ là tra cứu
              thuần tuý.
            </p>
            <div className="pt-4">
              <Link
                href="/kham-pha"
                className="inline-flex items-center rounded-lg bg-primary-container px-8 py-4 text-body-md font-semibold text-on-primary shadow-premium transition-all hover:scale-105 hover:shadow-hover active:scale-95"
              >
                Bắt đầu khám phá →
              </Link>
            </div>
          </div>
          <div className="group relative aspect-[4/3] w-full flex-1 overflow-hidden rounded-xl shadow-premium">
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary/20 to-transparent" />
            <img
              src={HERO_IMAGE}
              alt="Ruộng bậc thang Mù Cang Chải mùa lúa chín"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </section>

        {/* Feature cards */}
        <section className="py-section-gap">
          <div className="mb-16 text-center">
            <h2 className="font-h2 text-h2 text-on-surface">Công cụ hỗ trợ hành trình</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-primary-container" />
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {/* Card 1: Tìm kiếm nhanh */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-white p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="search" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Tìm kiếm nhanh</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Lọc địa điểm theo vùng miền (Bắc, Trung, Nam), chủ đề thiên nhiên hoặc văn hóa, và
                thời điểm lý tưởng trong năm.
              </p>
              <div className="space-y-3 rounded-lg bg-surface-container p-4">
                {SEARCH_FILTERS.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2 rounded-md border border-outline-variant/10 bg-white px-3 py-2 shadow-sm"
                  >
                    <Icon name={f.icon} className="scale-75 text-primary" />
                    <span className="text-label-caps text-on-surface-variant">{f.label}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Card 2: Bản đồ tương tác */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-white p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="map" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Bản đồ tương tác</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Trực quan hóa lộ trình với cụm điểm đến (POI clusters), xem mật độ đánh giá và lọc
                nhanh ngay trên giao diện bản đồ.
              </p>
              <div className="relative h-32 w-full overflow-hidden rounded-lg border border-outline-variant/30">
                <img
                  src={MAP_IMAGE}
                  alt="Bản đồ tương tác Việt Nam"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <span className="rounded-full bg-white/90 px-4 py-1 text-label-caps text-primary shadow-sm backdrop-blur-sm">
                    Xem bản đồ
                  </span>
                </div>
              </div>
            </article>

            {/* Card 3: Sổ tay cá nhân */}
            <article className="flex flex-col rounded-xl border border-outline-variant/30 bg-white p-8 shadow-premium transition-all hover:shadow-hover">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="book" className="text-3xl" />
              </div>
              <h3 className="mb-4 font-h3 text-h3">Sổ tay cá nhân</h3>
              <p className="mb-8 flex-grow text-on-surface-variant">
                Lưu trữ địa điểm yêu thích, tạo bộ sưu tập theo lịch trình riêng và chia sẻ đánh giá
                thực tế với cộng đồng du lịch.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'bookmark', label: 'Lưu' },
                  { icon: 'collections_bookmark', label: 'Sưu tập' },
                  { icon: 'rate_review', label: 'Review' },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-surface-container transition-colors hover:bg-primary-fixed"
                  >
                    <Icon name={q.icon} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {q.label}
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="border-t border-outline-variant/20 py-section-gap">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-label-caps uppercase text-primary">Gợi ý hôm nay</span>
              <h2 className="mt-2 font-h2 text-h2 text-on-surface">Cảm hứng lên đường</h2>
            </div>
            <Link
              href="/kham-pha"
              className="hidden font-semibold text-primary hover:underline sm:inline"
            >
              Xem tất cả địa điểm →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <Link key={c.title} href={c.href} className="group cursor-pointer">
                <div className="mb-4 aspect-[3/4] overflow-hidden rounded-xl shadow-sm transition-all group-hover:shadow-premium">
                  <img
                    src={c.image}
                    alt={c.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mb-1 text-label-caps text-on-surface-variant">{c.region}</p>
                <h4 className="font-h3 text-xl font-bold transition-colors group-hover:text-primary">
                  {c.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
