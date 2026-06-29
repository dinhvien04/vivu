import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/tai-khoan(.*)',
  '/so-tay(.*)',
  '/lich-trinh/cua-toi(.*)',
  '/admin(.*)',
  '/en/tai-khoan(.*)',
  '/en/so-tay(.*)',
  '/en/lich-trinh/cua-toi(.*)',
  '/en/admin(.*)',
]);

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
      return intlMiddleware(req);
    })
  : intlMiddleware;

export const config = {
  // Match all pathnames except for:
  // - `/api` (Next.js API routes)
  // - `/build-info` (safe deployment metadata JSON)
  // - `/_next` (Next internals)
  // - `/_vercel` (Vercel internals)
  // - Static files (anything with a dot in the last segment, e.g. `favicon.ico`)
  matcher: ['/((?!api|build-info|_next|_vercel|.*\\..*).*)'],
};
