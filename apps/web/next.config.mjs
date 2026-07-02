import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_URL);
const connectSrcExtra = splitSources(process.env.CSP_CONNECT_SRC_EXTRA);
const imgSrcExtra = splitSources(process.env.CSP_IMG_SRC_EXTRA);
const imageRemotePatterns = getImageRemotePatterns();
const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const turnstileOrigin = 'https://challenges.cloudflare.com';
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const clerkOrigins = clerkEnabled
  ? ['https://*.clerk.accounts.dev', 'https://*.clerk.dev', 'https://*.clerk.com']
  : [];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}${turnstileEnabled ? ` ${turnstileOrigin}` : ''} ${clerkOrigins.join(' ')}`.trim(),
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${clerkOrigins.join(' ')}`.trim(),
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https: ${imgSrcExtra.join(' ')}`.trim(),
  `connect-src 'self' ${apiOrigin ? apiOrigin : ''} ${turnstileEnabled ? turnstileOrigin : ''} https://api.open-meteo.com ${clerkOrigins.join(' ')} ${connectSrcExtra.join(' ')}`.trim(),
  `frame-src 'self'${turnstileEnabled ? ` ${turnstileOrigin}` : ''} ${clerkOrigins.join(' ')}`.trim(),
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
  reactStrictMode: false,
  transpilePackages: ['@vivu/types'],
  allowedDevOrigins: ['127.0.0.1:3100', 'localhost:3100'],
  images: {
    remotePatterns: imageRemotePatterns,
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
           { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()' },
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

function getImageRemotePatterns() {
  const configuredHosts = splitSources(process.env.NEXT_IMAGE_REMOTE_HOSTS);
  const hosts =
    configuredHosts.length > 0
      ? configuredHosts
      : isProduction
        ? [
            'res.cloudinary.com',
            'gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com',
            's3.ap-southeast-1.amazonaws.com',
          ]
        : ['**'];

  // Development keeps the previous wildcard behaviour so local data from
  // arbitrary image hosts still renders. Production should set
  // NEXT_IMAGE_REMOTE_HOSTS explicitly when new image providers are added.
  return hosts.map((hostname) => ({ protocol: 'https', hostname }));
}
