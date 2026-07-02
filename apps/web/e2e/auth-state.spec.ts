import { expect, test } from '@playwright/test';
import { getLocalizedAuthRedirect, getSafeAuthRedirect } from '../src/lib/auth-redirect';
import { clerkUserToAuthUser } from '../src/lib/clerk-user';

test.describe('auth state helpers', () => {
  test('accepts only same-origin redirect paths and localizes them', () => {
    expect(getSafeAuthRedirect('/tai-khoan?tab=reviews', '/')).toBe('/tai-khoan?tab=reviews');
    expect(getSafeAuthRedirect('https://example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getSafeAuthRedirect('//example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getSafeAuthRedirect('/\\example.com', '/tai-khoan')).toBe('/tai-khoan');
    expect(getLocalizedAuthRedirect('/tai-khoan', 'en')).toBe('/en/tai-khoan');
    expect(getLocalizedAuthRedirect('/en/tai-khoan', 'en')).toBe('/en/tai-khoan');
  });

  test('creates a signed-in display profile while the API profile is syncing', () => {
    const user = clerkUserToAuthUser({
      id: 'user_clerk_1',
      primaryEmailAddress: { emailAddress: 'tester@example.com' },
      emailAddresses: [{ emailAddress: 'tester@example.com' }],
      firstName: 'Vivu',
      lastName: 'Tester',
      fullName: 'Vivu Tester',
      imageUrl: 'https://img.example.com/avatar.png',
      createdAt: new Date('2026-07-02T00:00:00.000Z'),
    });

    expect(user).toMatchObject({
      id: 'user_clerk_1',
      clerkUserId: 'user_clerk_1',
      email: 'tester@example.com',
      name: 'Vivu Tester',
      role: 'user',
      avatarUrl: 'https://img.example.com/avatar.png',
    });
  });
});
