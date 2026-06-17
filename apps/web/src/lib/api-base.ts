export const PRODUCTION_API_URL = 'https://vivu-api.vercel.app';

export function getPublicApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : 'http://localhost:4000')
  );
}

export function getInternalApiBase(): string {
  return process.env.API_INTERNAL_URL ?? getPublicApiBase();
}
