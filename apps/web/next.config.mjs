import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vivu/types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // typedRoutes disabled while routes are still being scaffolded.
  // Re-enable once route inventory stabilises.
  typedRoutes: false,
};

export default withNextIntl(nextConfig);
