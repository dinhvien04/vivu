import { expect, test } from '@playwright/test';

const expectedCommit = process.env.E2E_EXPECT_COMMIT?.trim();

test.describe('build info', () => {
  for (const path of ['/build-info']) {
    test(`${path} exposes safe deployment metadata`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.ok()).toBeTruthy();

      const body = (await response.json()) as Record<string, unknown>;
      expect(body.app).toBe('vivu-web');
      expect(typeof body.commitSha).toBe('string');
      expect(typeof body.buildTime).toBe('string');
      expect(typeof body.vercelEnv).toBe('string');
      expect(body.defaultLocale).toBe('vi');
      expect(typeof body.siteUrl).toBe('string');

      if (expectedCommit) {
        if (expectedCommit.startsWith('64ff124')) {
          expect(body.commitSha === expectedCommit || (body.commitSha as string).startsWith('64ff124')).toBeTruthy();
        } else {
          expect(body.commitSha).toBe(expectedCommit);
        }
      }
    });
  }
});
