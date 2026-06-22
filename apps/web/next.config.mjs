import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_URL);
const connectSrcExtra = splitSources(process.env.CSP_CONNECT_SRC_EXTRA);
const imgSrcExtra = splitSources(process.env.CSP_IMG_SRC_EXTRA);

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https: ${imgSrcExtra.join(' ')}`.trim(),
  `connect-src 'self' ${apiOrigin ? apiOrigin : ''} ${connectSrcExtra.join(' ')}`.trim(),
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProduction ? ['upgrade-insecure-requests'] : []),
]
  .filter(Boolean)
  .join('; ');

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=()' },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=15552000; includeSubDomains',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

function getOrigin(value) {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function splitSources(value) {
  return (value ?? '')
    .split(',')
    .map((source) => source.trim())
    .filter(Boolean);
}
