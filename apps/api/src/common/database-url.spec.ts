import { parseDatabaseHostname } from './database-url';

describe('parseDatabaseHostname', () => {
  it('extracts hostname from postgres URLs without exposing credentials', () => {
    expect(
      parseDatabaseHostname('postgresql://user:secret@ep-pooler.neon.tech/vivu?sslmode=require'),
    ).toBe('ep-pooler.neon.tech');
  });

  it('returns undefined for invalid URLs', () => {
    expect(parseDatabaseHostname('not-a-url')).toBeUndefined();
    expect(parseDatabaseHostname(undefined)).toBeUndefined();
  });
});
