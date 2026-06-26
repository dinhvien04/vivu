/**
 * Strips HTML tags from a string to prevent XSS.
 */
export function sanitizeText(value: string | undefined | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/<[^>]*>/g, '').trim();
  return cleaned || null;
}

export function sanitizeRequiredText(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}
