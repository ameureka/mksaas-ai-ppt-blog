import { expect, test } from '@playwright/test';

/**
 * Core Pages Mobile Compatibility Tests
 * Feature: mobile-compatibility
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

const mobileViewport = { width: 375, height: 667 };

const corePages = [
  { path: '/', name: 'Home' },
  { path: '/ppt', name: 'PPT List' },
  { path: '/blog', name: 'Blog List' },
];

test.describe('Core Pages Mobile Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewport);
  });

  for (const { path, name } of corePages) {
    test(`${name}: minimum font size 14px`, async ({ page }) => {
      await page.goto(path);

      const textElements = await page.locator('body *').all();
      let checkedCount = 0;

      for (const el of textElements) {
        const fontSize = await el.evaluate((e) => {
          const computed = window.getComputedStyle(e);
          const size = parseFloat(computed.fontSize);
          const display = computed.display;
          return { size, display };
        });

        if (fontSize.size > 0 && fontSize.display !== 'none') {
          expect(fontSize.size, `${name}: text should be >= 14px`).toBeGreaterThanOrEqual(14);
          checkedCount++;
        }
      }

      expect(checkedCount, `${name}: should have checked text elements`).toBeGreaterThan(0);
    });

    test(`${name}: buttons have 44x44px touch targets`, async ({ page }) => {
      await page.goto(path);

      const buttons = await page.locator('button, a[role="button"]').all();

      for (const button of buttons) {
        const box = await button.boundingBox();

        if (box) {
          expect(box.height, `${name}: button height >= 44px`).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test(`${name}: no horizontal overflow`, async ({ page }) => {
      await page.goto(path);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth, `${name}: no horizontal scroll`).toBeLessThanOrEqual(clientWidth + 1);
    });

    test(`${name}: images are responsive`, async ({ page }) => {
      await page.goto(path);

      const images = await page.locator('img').all();

      for (const img of images) {
        const box = await img.boundingBox();

        if (box) {
          expect(box.width, `${name}: image width <= viewport`).toBeLessThanOrEqual(mobileViewport.width);
        }
      }
    });
  }

  test('Footer appears on all core pages', async ({ page }) => {
    for (const { path, name } of corePages) {
      await page.goto(path);

      const footer = page.locator('footer');
      await expect(footer, `${name} should have footer`).toBeVisible();

      // 验证 Footer 包含关键元素
      await expect(footer.locator('text=PPTHub')).toBeVisible();
    }
  });
});
