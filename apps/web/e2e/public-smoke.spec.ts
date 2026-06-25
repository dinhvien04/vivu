import { expect, test } from '@playwright/test';

test.describe('public production smoke', () => {
  test('Vietnamese home stays on the default locale and exposes build meta', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('link', { name: /Trang chủ|Home/i }).first()).toBeVisible();
    expect(new URL(page.url()).pathname).not.toMatch(/^\/en(?:\/|$)/);
    await expect(page.locator('meta[name="vivu-build-sha"]')).toHaveAttribute('content', /.+/);
  });

  test('English home keeps the /en locale prefix', async ({ page }) => {
    const response = await page.goto('/en', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('link', { name: /Home|Trang chủ/i }).first()).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/^\/en(?:\/|$)/);
  });

  for (const path of ['/lich-trinh', '/tu-van']) {
    test(`${path} loads without a server error`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('body')).not.toContainText(/500|Application error/i);
    });
  }

  test('/tu-van renders Turnstile only when the public site key is configured', async ({ page }) => {
    await page.goto('/tu-van', { waitUntil: 'domcontentloaded' });
    const widget = page.getByTestId('turnstile-widget');
    if ((await widget.count()) > 0) {
      await expect(widget).toBeVisible();
    } else {
      await expect(widget).toHaveCount(0);
    }
  });

  test('robots.txt is available', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('User-Agent');
  });

  test('sitemap.xml excludes private shared itinerary URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('<urlset');
    expect(text).not.toContain('/lich-trinh/chia-se/');
  });
});
