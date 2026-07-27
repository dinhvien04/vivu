import { expect, test } from '@playwright/test';
import { getLocalizedAuthRedirect, getSafeAuthRedirect } from '../src/lib/auth-redirect';

test.describe('auth state helpers', () => {
  test('accepts only same-origin redirect paths and localizes them', () => {
    expect(getSafeAuthRedirect('/tai-khoan?tab=reviews', '/')).toBe('/tai-khoan?tab=reviews');
    expect(getSafeAuthRedirect('https://example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getSafeAuthRedirect('//example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getSafeAuthRedirect('/\\example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getLocalizedAuthRedirect('/tai-khoan', 'en')).toBe('/en/tai-khoan');
    expect(getLocalizedAuthRedirect('/en/tai-khoan', 'en')).toBe('/en/tai-khoan');
  });

  test('falls back to a safe internal route for malformed redirects', () => {
    expect(getSafeAuthRedirect('javascript:alert(1)', '/')).toBe('/');
    expect(getSafeAuthRedirect('/admin\nhttps://example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getSafeAuthRedirect('', '/tai-khoan')).toBe('/tai-khoan');
  });
});
