import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - `/api` (Next.js API routes)
  // - `/_next` (Next internals)
  // - `/_vercel` (Vercel internals)
  // - Static files (anything with a dot in the last segment, e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
