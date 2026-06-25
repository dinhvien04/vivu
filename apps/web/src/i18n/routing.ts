import { defineRouting } from 'next-intl/routing';

/**
 * next-intl routing config.
 *
 * - `locales`: list of supported BCP-47 codes
 * - `defaultLocale`: 'vi' (Vietnamese)
 * - `localePrefix: 'as-needed'`: the default locale (vi) does not have a URL
 *   prefix, so legacy Vietnamese URLs like `/kham-pha`, `/dia-diem/[slug]` keep
 *   working unchanged. English routes are prefixed with `/en`.
 *
 * Slugs are shared across locales (we do not translate URL paths) so we use
 * the simpler shared-pathnames mode.
 *
 * `localeDetection: false` keeps `/` on Vietnamese instead of redirecting to
 * `/en` from an English browser Accept-Language header. Users can still switch
 * languages explicitly via the locale toggle.
 */
export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
