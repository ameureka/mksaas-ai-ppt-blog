import { expect, test } from '@playwright/test';

/**
 * Mobile Compatibility Property-Based Tests
 * Feature: mobile-compatibility
 */

// **Property 1: Minimum font size on mobile**
// **Validates: Requirements 1.1**
test.describe('Footer Mobile Compatibility', () => {
  const mobileViewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 390, height: 844, name: 'iPhone 12' },
    { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  ];

  for (const viewport of mobileViewports) {
    test(`Property 1: all footer text >= 14px on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // 获取 Footer 内所有文本元素
      const textElements = await page.locator('footer *').all();
      
      for (const el of textElements) {
        const fontSize = await el.evaluate((e) => {
          const computed = window.getComputedStyle(e);
          return parseFloat(computed.fontSize);
        });

        // 忽略不可见元素和非文本元素
        if (fontSize > 0) {
          expect(fontSize, `Element should have font-size >= 14px at ${viewport.width}px`).toBeGreaterThanOrEqual(14);
        }
      }
    });
  }

  // **Property 2: Social icon touch target size**
  // **Validates: Requirements 2.1**
  test('Property 2: social icons meet 44x44px minimum', async ({ page }) => {
    await page.goto('/');

    const socialIcons = await page.locator('footer a[aria-label]').all();
    
    expect(socialIcons.length, 'Should have social icons').toBeGreaterThan(0);

    for (const icon of socialIcons) {
      const box = await icon.boundingBox();
      
      if (box) {
        expect(box.width, 'Icon width should be >= 44px').toBeGreaterThanOrEqual(44);
        expect(box.height, 'Icon height should be >= 44px').toBeGreaterThanOrEqual(44);
      }
    }
  });

  // **Property 3: Social icon spacing**
  // **Validates: Requirements 2.2**
  test('Property 3: social icons have >= 8px spacing', async ({ page }) => {
    await page.goto('/');

    const socialIcons = await page.locator('footer a[aria-label]').all();
    
    if (socialIcons.length < 2) {
      test.skip();
      return;
    }

    for (let i = 0; i < socialIcons.length - 1; i++) {
      const box1 = await socialIcons[i].boundingBox();
      const box2 = await socialIcons[i + 1].boundingBox();

      if (box1 && box2) {
        const gap = box2.x - (box1.x + box1.width);
        expect(gap, `Gap between icon ${i} and ${i + 1} should be >= 8px`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  // **Property 4: No horizontal overflow at minimum viewport**
  // **Validates: Requirements 1.4, 4.4**
  test('Property 4: no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth, 'Should not have horizontal overflow').toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
  });

  // **Property 5: Link vertical spacing on mobile**
  // **Validates: Requirements 3.1**
  test('Property 5: footer links have >= 12px vertical spacing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 检查 Categories 列表的链接间距
    const categoryLinks = await page.locator('footer ul').first().locator('li').all();

    if (categoryLinks.length < 2) {
      test.skip();
      return;
    }

    for (let i = 0; i < categoryLinks.length - 1; i++) {
      const box1 = await categoryLinks[i].boundingBox();
      const box2 = await categoryLinks[i + 1].boundingBox();

      if (box1 && box2) {
        const gap = box2.y - (box1.y + box1.height);
        expect(gap, `Vertical gap between link ${i} and ${i + 1} should be >= 12px`).toBeGreaterThanOrEqual(12);
      }
    }
  });

  // **Property 6: Link touch target height**
  // **Validates: Requirements 3.2**
  test('Property 6: footer links have >= 44px touch target height', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const footerLinks = await page.locator('footer a').all();

    for (const link of footerLinks) {
      const box = await link.boundingBox();
      
      if (box) {
        expect(box.height, 'Link touch target height should be >= 44px').toBeGreaterThanOrEqual(44);
      }
    }
  });

  // **Property 8: Responsive column layout**
  // **Validates: Requirements 4.1, 4.2, 4.3**
  test('Property 8: responsive layout at different breakpoints', async ({ page }) => {
    await page.goto('/');

    // Mobile: 1 column
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileGrid = await page.locator('footer .grid').first();
    const mobileClass = await mobileGrid.getAttribute('class');
    expect(mobileClass, 'Should have grid-cols-1 for mobile').toContain('grid-cols-1');

    // Tablet: 2 columns
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletClass = await mobileGrid.getAttribute('class');
    expect(tabletClass, 'Should have md:grid-cols-2 for tablet').toContain('md:grid-cols-2');

    // Desktop: 6 columns
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopClass = await mobileGrid.getAttribute('class');
    expect(desktopClass, 'Should have lg:grid-cols-6 for desktop').toContain('lg:grid-cols-6');
  });
});
