import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/tai-khoan',
          '/tai-khoan/',
          '/so-tay',
          '/so-tay/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
