export function parseCorsOrigins(
  raw: string | undefined,
  fallback = 'http://localhost:3000',
): string[] {
  const values = (raw ?? fallback)
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter((origin) => origin.length > 0 && origin !== '*');

  return values.length > 0 ? values : [fallback.toLowerCase()];
}
