/**
 * Server-side plain-text normalization for user-generated content.
 * API responses treat these fields as plain text; clients must escape on render.
 */

const BASIC_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeBasicEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return BASIC_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function stripHtmlLikeMarkup(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '');
}

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

export function sanitizeText(value: string | undefined | null): string | null {
  if (value == null) return null;
  let cleaned = stripControlChars(String(value));
  cleaned = stripHtmlLikeMarkup(cleaned);
  cleaned = decodeBasicEntities(cleaned);
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

export function sanitizeRequiredText(value: string): string {
  const cleaned = sanitizeText(value);
  return cleaned ?? '';
}
