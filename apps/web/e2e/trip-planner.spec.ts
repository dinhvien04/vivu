import { expect, test } from '@playwright/test';

const mockedPlan = {
  data: {
    id: 'plan-e2e',
    title: 'Lịch trình Gia Lai mock',
    shareId: null,
    isPublic: false,
    output: {
      title: 'Lịch trình Gia Lai mock',
      summary: 'Kịch bản e2e không gọi Gemini thật.',
      days: [
        {
          day: 1,
          theme: 'Biển đảo và check-in',
          items: [
            {
              timeOfDay: 'morning',
              placeName: 'Kỳ Co',
              placeSlug: 'ky-co',
              reason: 'Phù hợp để kiểm tra UI lịch trình.',
              suggestedDuration: '2 giờ',
              travelNote: 'Đi sớm để tránh nắng.',
              tips: ['Mang nước uống'],
            },
          ],
          foodSuggestions: ['Hải sản Quy Nhơn'],
          notes: ['Đây là dữ liệu mock cho e2e.'],
        },
      ],
      generalTips: ['Kiểm tra thời tiết trước khi đi.'],
      missingDataNote: null,
    },
  },
};

test('trip planner renders a mocked generated itinerary without calling Gemini', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 204,
      body: '',
    }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthenticated in e2e' }),
    }),
  );
  await page.route('**/api/analytics/events', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  );
  let generateCalled = false;
  await page.route('**/api/trip-plans/generate', async (route) => {
    generateCalled = true;
    expect(route.request().method()).toBe('POST');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockedPlan),
    });
  });

  await page.goto('/lich-trinh', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const generateButton = page.getByRole('button', {
    name: /Tạo lịch trình AI|Create AI itinerary/i,
  });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  await expect.poll(() => generateCalled).toBe(true);
  await expect(page.getByRole('heading', { name: 'Lịch trình Gia Lai mock' })).toBeVisible();
  await expect(page.getByText('Kỳ Co')).toBeVisible();
  await expect(page.getByText('Kịch bản e2e không gọi Gemini thật.')).toBeVisible();
});
