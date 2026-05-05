import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vivu — Tra cứu địa điểm du lịch Việt Nam',
    template: '%s · Vivu',
  },
  description:
    'Vivu là portal tra cứu địa điểm du lịch Việt Nam: khám phá theo vùng miền, chủ đề, mùa, kèm bản đồ và đánh giá cộng đồng.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
