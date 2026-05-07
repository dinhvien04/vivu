
import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Inter } from 'next/font/google';
import { AuthProvider } from '../components/auth-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

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
    <html lang="vi" className={`${inter.variable} ${beVietnamPro.variable}`}>
      <head>
        {/* Material Symbols Outlined — used for inline icons matching the design system. */}
        {/* Loaded on every page from the root layout, so the no-page-custom-font rule does not apply. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
