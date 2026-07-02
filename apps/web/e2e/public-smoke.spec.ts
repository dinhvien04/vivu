import { expect, type Page, test } from '@playwright/test';

async function openHeroLightbox(page: Page) {
  const openButton = page.getByTestId('gallery-open-image').first();
  await expect(openButton).toBeVisible();

  const box = await openButton.boundingBox();
  expect(box).not.toBeNull();
  await openButton.click({
    position: {
      x: Math.min(24, box!.width / 2),
      y: Math.min(24, box!.height / 2),
    },
  });
  await expect(page.getByTestId('photo-lightbox')).toBeVisible();
}

async function mockSignedOutAuth(page: Page) {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthenticated in e2e' }),
    }),
  );
}

async function expectLightboxCoversHeroCtas(page: Page) {
  const coverage = await page.evaluate(() => {
    const lightbox = document.querySelector('[data-testid="photo-lightbox"]');
    const selectors = [
      'a[href^="/lich-trinh?place="]',
      'a[href^="/tu-van?source=place_detail_hero"]',
      'a[href^="/ai-chat?place="]',
    ];

    return selectors.map((selector) => {
      const cta = document.querySelector(selector);
      if (!lightbox || !cta) return { selector, covered: false };
      const rect = cta.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { selector, covered: Boolean(top && (top === lightbox || lightbox.contains(top))) };
    });
  });

  expect(coverage.every((item) => item.covered)).toBeTruthy();
}

test.describe('public production smoke', () => {
  test('Vietnamese home stays on the default locale, exposes build meta, and shows key widgets', async ({
    page,
  }) => {
    await mockSignedOutAuth(page);
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

  test('signed-out header exposes sign-in and sign-up actions', async ({ page }) => {
    await mockSignedOutAuth(page);
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('a[href*="dang-nhap"]').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('a[href*="dang-ky"]').first()).toBeVisible();
  });

  test('auth pages render the Vivu shell and an auth form', async ({ page }) => {
    await mockSignedOutAuth(page);

    for (const url of ['/dang-nhap', '/dang-ky']) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByTestId('auth-shell')).toBeVisible();
      await expect(page.getByTestId('auth-benefit')).toHaveCount(3);
      await expect(page.getByTestId('auth-form-panel')).toBeVisible();
      await expect(page.getByTestId('auth-form-panel').locator('form').first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('body')).not.toContainText(/500|Application error/i);
    }
  });

  test('English auth shell stays translated', async ({ page }) => {
    await mockSignedOutAuth(page);
    const response = await page.goto('/en/dang-nhap', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: 'Welcome back to Vivu', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText('Save AI itineraries');
    await expect(page.locator('body')).not.toContainText('Chào mừng trở lại Vivu');
  });

  test('/lich-trinh loads the AI trip planner form', async ({ page }) => {
    const response = await page.goto('/lich-trinh', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toContainText(/500|Application error/i);
    await expect(
      page.getByRole('button', { name: /Tạo lịch trình AI|Generate AI Itinerary/i }).first(),
    ).toBeVisible();
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

  test('robots.txt is available and blocks admin/api while exposing Sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text.toLowerCase()).toContain('user-agent:');
    expect(text.toLowerCase()).toContain('disallow: /admin');
    expect(text.toLowerCase()).toContain('disallow: /api');
    expect(text.toLowerCase()).toContain('sitemap:');
  });

  test('sitemap.xml includes public routes and excludes private/admin paths', async ({
    request,
  }) => {
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

  test('legal pages and contact page are available and clean from placeholder tags', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await mockSignedOutAuth(page);
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

  test('/dia-diem/suoi-da-vang detail page renders correctly without crash', async ({ page }) => {
    // Mock APIs to ensure data is returned for suo-da-vang in E2E
    await page.route('**/api/places/suoi-da-vang', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'suoi-da-vang-id',
          slug: 'suoi-da-vang',
          titleVi: 'Suối Đá Vàng',
          titleEn: 'Suoi Da Vang',
          summaryVi: 'Điểm tham quan dã ngoại tuyệt vời.',
          summaryEn: 'Great picnic spot.',
          descriptionVi: 'Suối Đá Vàng tại Gia Lai.',
          descriptionEn: 'Golden Rock Stream in Gia Lai.',
          heroImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          address: 'Kông Chro, Gia Lai',
          province: 'Gia Lai',
          bestSeasons: [11, 12, 1, 2, 3, 4],
          isAiReady: true,
          categories: [
            {
              id: 'cat-1',
              slug: 'danh-lam-thang-canh',
              nameVi: 'Danh lam thắng cảnh',
              icon: 'landscape',
            },
          ],
          geo: { lat: 13.98, lng: 108.01 },
          photos: [],
        }),
      }),
    );
    await page.route('**/api/places/suoi-da-vang/reviews*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0 } }),
      }),
    );
    await page.route('**/api/places/suoi-da-vang/questions*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0 } }),
      }),
    );
    await page.route('**/api/places/nearby*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    const response = await page.goto('/dia-diem/suoi-da-vang', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vivu' }).first()).toBeVisible();

    // Verify Title
    await expect(page.getByRole('heading', { name: /Suối Đá Vàng/i, level: 1 })).toBeVisible();

    // Verify Hero CTAs
    await expect(
      page.getByRole('link', { name: /Thêm vào lịch trình|Tạo lịch trình|Plan trip/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Hỏi Vivu AI|Ask AI/i }).first()).toBeVisible();
    await expect(page.locator('a[href^="/tu-van?source=place_detail_hero"]').first()).toBeVisible();

    await openHeroLightbox(page);
    await expect(page.getByTestId('photo-lightbox-close')).toBeVisible();
    await expect(page.getByTestId('photo-lightbox-close')).toBeFocused();
    await expect(page.getByTestId('photo-lightbox-zoom')).toBeVisible();

    if ((await page.getByTestId('photo-lightbox-counter').count()) > 0) {
      await expect(page.getByTestId('photo-lightbox-counter')).toBeVisible();
      await expect(page.getByTestId('photo-lightbox-prev')).toBeVisible();
      await expect(page.getByTestId('photo-lightbox-next')).toBeVisible();
    }

    const lightboxLayer = await page.evaluate(() => {
      const lightbox = document.querySelector('[data-testid="photo-lightbox"]');
      return {
        parentIsBody: lightbox?.parentElement === document.body,
        zIndex: lightbox ? Number(getComputedStyle(lightbox).zIndex) : 0,
        bodyOverflow: document.body.style.overflow,
        documentOverflow: document.documentElement.style.overflow,
      };
    });
    expect(lightboxLayer.parentIsBody).toBeTruthy();
    expect(lightboxLayer.zIndex).toBeGreaterThanOrEqual(1000);
    expect(lightboxLayer.bodyOverflow).toBe('hidden');
    expect(lightboxLayer.documentOverflow).toBe('hidden');
    await expectLightboxCoversHeroCtas(page);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('photo-lightbox')).toBeHidden();
    await expect(page.getByTestId('gallery-open-image').first()).toBeFocused();
    await expect(page.locator('a[href^="/lich-trinh?place=suoi-da-vang"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/tu-van?source=place_detail_hero"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/ai-chat?place=suoi-da-vang"]').first()).toBeVisible();

    // Verify Quick Info Grid
    await expect(page.locator('body')).toContainText('Vùng miền');
    await expect(page.locator('body')).toContainText('Giá vé');

    // Verify Conversion Section
    await expect(page.locator('body')).toContainText('Bắt đầu hành trình của bạn tại Suối Đá Vàng');
    await expect(page.locator('body')).toContainText('Dựa trên dữ liệu thực tế từ 67 địa danh');
  });

  test('/dia-diem/suoi-da-vang lightbox is usable on mobile', async ({ page }) => {
    await mockSignedOutAuth(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto('/dia-diem/suoi-da-vang', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    await openHeroLightbox(page);
    await expect(page.getByTestId('photo-lightbox-close')).toBeVisible();
    await expect(page.getByTestId('photo-lightbox-close')).toBeFocused();

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalScroll).toBeFalsy();

    await page.getByTestId('photo-lightbox-close').click();
    await expect(page.getByTestId('photo-lightbox')).toBeHidden();
    await expect(page.locator('a[href^="/lich-trinh?place=suoi-da-vang"]').first()).toBeVisible();
  });

  test('no horizontal scroll on key routes at mobile viewport', async ({ page }) => {
    test.setTimeout(60_000);
    await mockSignedOutAuth(page);
    // Set typical mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    const testUrls = ['/', '/kham-pha', '/lich-trinh', '/dang-nhap', '/dang-ky'];
    for (const url of testUrls) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Check if page width exceeds viewport width
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });
});
