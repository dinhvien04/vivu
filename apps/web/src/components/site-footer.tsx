import Link from 'next/link';
import { Icon } from './icon';

const COLUMNS = [
  {
    title: 'Sản phẩm',
    items: [
      { label: 'Về chúng tôi', href: '#' },
      { label: 'Cẩm nang', href: '#' },
      { label: 'Điểm đến', href: '#' },
    ],
  },
  {
    title: 'Pháp lý',
    items: [
      { label: 'Điều khoản', href: '#' },
      { label: 'Bảo mật', href: '#' },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      { label: 'Liên hệ', href: '#' },
      { label: 'Trợ giúp', href: '#' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container">
      <div className="mx-auto flex w-full max-w-container-max flex-col items-start justify-between gap-12 px-margin-mobile py-section-gap md:flex-row md:px-margin-desktop">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-on-primary"
            >
              <span className="font-display text-sm font-extrabold tracking-tight">V</span>
            </span>
            <span className="font-display text-h3 font-bold text-primary">Vivu</span>
          </Link>
          <p className="font-sans leading-relaxed text-on-secondary-fixed-variant">
            © 2024 Vivu. Khám phá vẻ đẹp Việt Nam qua lăng kính bản địa. Chúng tôi cung cấp dữ liệu
            tra cứu thuần túy để bạn tự do thiết kế hành trình của mình.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <h5 className="text-label-caps font-bold text-primary">{col.title}</h5>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-container-max border-t border-outline-variant/30 px-margin-mobile py-8 text-center md:px-margin-desktop">
        <div className="mb-4 flex justify-center gap-6">
          <a
            href="#"
            aria-label="Facebook"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="public" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="photo_camera" />
          </a>
          <a
            href="#"
            aria-label="YouTube"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="smart_display" />
          </a>
        </div>
        <p className="text-[12px] text-outline">Thiết kế bởi Vivu Team · 2024</p>
      </div>
    </footer>
  );
}
