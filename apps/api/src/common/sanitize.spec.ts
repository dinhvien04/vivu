import { sanitizeRequiredText, sanitizeText } from './sanitize';

describe('sanitize plain text', () => {
  it('strips HTML tags and script-like payloads from review content', () => {
    const input = '<img src=x onerror=alert(1)>Hello <b>world</b>';
    expect(sanitizeRequiredText(input)).toBe('Hello world');
  });

  it('decodes entities and removes control characters from lead notes', () => {
    const input = 'Li&ecirc;n h&#7879;\u0000<script>alert(1)</script>';
    expect(sanitizeText(input)).toBe('Li&ecirc;n hệ');
  });

  it('normalizes data report messages to plain text', () => {
    const input = '<a href="javascript:alert(1)">bad</a> report';
    expect(sanitizeRequiredText(input)).toBe('bad report');
  });

  it('returns null for empty sanitized values', () => {
    expect(sanitizeText('<br><hr>')).toBeNull();
  });
});
