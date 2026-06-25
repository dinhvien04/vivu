import { routing } from '@/i18n/routing';
import { SITE_URL } from './site-url';

const BUILD_TIME =
  process.env.NEXT_PUBLIC_BUILD_TIME?.trim() ||
  process.env.BUILD_TIME?.trim() ||
  new Date().toISOString();

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : 'unknown';
}

export interface BuildInfo {
  app: 'vivu-web';
  commitSha: string;
  commitMessage: string;
  appVersion: string;
  buildTime: string;
  environment: string;
  defaultLocale: string;
  siteUrl: string;
}

export function getBuildInfo(): BuildInfo {
  return {
    app: 'vivu-web',
    commitSha: readEnv('VERCEL_GIT_COMMIT_SHA'),
    commitMessage: readEnv('VERCEL_GIT_COMMIT_MESSAGE'),
    appVersion: readEnv('NEXT_PUBLIC_APP_VERSION'),
    buildTime: BUILD_TIME,
    environment: process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || 'unknown',
    defaultLocale: routing.defaultLocale,
    siteUrl: SITE_URL,
  };
}
