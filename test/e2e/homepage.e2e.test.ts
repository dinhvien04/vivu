import { test, expect } from '@playwright/test';

test.describe('Homepage E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Vivu · Du lịch Việt Nam');
    
    // Check tagline
    await expect(page.getByText('Portal tra cứu địa điểm du lịch')).toBeVisible();
    
    // Check version badge
    await expect(page.getByText('v0.0.0 — scaffold')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    // Check all three feature cards
    await expect(page.getByText('Tìm kiếm nhanh')).toBeVisible();
    await expect(page.getByText('Bản đồ tương tác')).toBeVisible();
    await expect(page.getByText('Sổ tay cá nhân')).toBeVisible();
    
    // Check feature descriptions
    await expect(page.getByText('Typeahead, lọc theo vùng/loại/mùa.')).toBeVisible();
    await expect(page.getByText('POI cluster, lọc trực quan trên bản đồ.')).toBeVisible();
    await expect(page.getByText('Lưu địa điểm, tạo collection, viết review.')).toBeVisible();
  });

  test('should navigate to discovery page', async ({ page }) => {
    // Click the CTA button
    await page.getByRole('link', { name: /Bắt đầu khám phá/ }).click();
    
    // Should navigate to /kham-pha
    await expect(page).toHaveURL('/kham-pha');
    
    // Should see the discovery page heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Khám phá');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and properly laid out
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Tìm kiếm nhanh')).toBeVisible();
    await expect(page.getByRole('link', { name: /Bắt đầu khám phá/ })).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check that CTA button is accessible
    const ctaButton = page.getByRole('link', { name: /Bắt đầu khám phá/ });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', '/kham-pha');
    
    // Check main landmark
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should have correct meta information', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Vivu — Tra cứu địa điểm du lịch Việt Nam/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Vivu là portal tra cứu địa điểm du lịch Việt Nam/);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Should not have any console errors
    expect(errors).toHaveLength(0);
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for main element
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for proper heading structure
    const headings = page.getByRole('heading');
    await expect(headings).toHaveCount(4); // 1 main + 3 feature headings
    
    // Check for links
    const links = page.getByRole('link');
    await expect(links).toHaveCount(1); // CTA link
  });
});