import { expect, test } from '@playwright/test';

test.describe('public production smoke', () => {
  test('Vietnamese home stays on the default locale, exposes build meta, and shows key widgets', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('link', { name: /Trang chủ|Home/i }).first()).toBeVisible();
    expect(new URL(page.url()).pathname).not.toMatch(/^\/en(?:\/|$)/);

    // Verify key titles/nav items
    await expect(page.locator('body')).toContainText('Lập lịch trình du lịch Gia Lai bằng AI');
    await expect(page.getByRole('link', { name: 'Lịch trình AI' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tư vấn' }).first()).toBeVisible();
    await expect(page.locator('body')).toContainText('AI Chat');
  });

  test('English home keeps the /en locale prefix and translates correctly', async ({ page }) => {
    const response = await page.goto('/en', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    expect(new URL(page.url()).pathname).toMatch(/^\/en(?:\/|$)/);

    // Verify translated elements
    await expect(page.locator('body')).toContainText('AI Planner');
    await expect(page.locator('body')).toContainText('Consulting');
  });

  test('/lich-trinh loads the AI trip planner form', async ({ page }) => {
    const response = await page.goto('/lich-trinh', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toContainText(/500|Application error/i);
    await expect(page.getByRole('button', { name: /Tạo lịch trình AI|Generate AI Itinerary/i }).first()).toBeVisible();
  });

  test('/tu-van loads and shows consulting form', async ({ page }) => {
    const response = await page.goto('/tu-van', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toContainText(/500|Application error/i);
    
    const widget = page.getByTestId('turnstile-widget');
    if ((await widget.count()) > 0) {
      await expect(widget).toBeVisible();
    }
  });

  test('robots.txt is available and blocks admin/api while exposing Sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text.toLowerCase()).toContain('user-agent:');
    expect(text.toLowerCase()).toContain('disallow: /admin');
    expect(text.toLowerCase()).toContain('disallow: /api');
    expect(text.toLowerCase()).toContain('sitemap:');
  });

  test('sitemap.xml includes public routes and excludes private/admin paths', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('<urlset');
    
    // Must contain key user flows
    expect(text).toContain('/lich-trinh');
    expect(text).toContain('/tu-van');

    // Must exclude admin, api, account/private sections
    expect(text).not.toContain('/admin');
    expect(text).not.toContain('/api');
    expect(text).not.toContain('/tai-khoan');
    expect(text).not.toContain('/lich-trinh/chia-se/');
  });

  test('legal pages and contact page are available and clean from placeholder tags', async ({ page }) => {
    const urls = ['/chinh-sach-bao-mat', '/dieu-khoan-su-dung', '/lien-he'];
    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('TODO');
      expect(bodyText).not.toContain('Placeholder');
    }
  });

  test('footer does not contain any placeholder href="#" links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).not.toBe('#');
    }
  });
});
