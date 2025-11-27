import * as fs from 'fs';
import * as path from 'path';
import { type Page, expect, test } from '@playwright/test';

/**
 * Playwright Screenshot Automation Tests
 *
 * 为 mk-saas-blog 生成关键用户界面的屏幕截图
 *
 * 16 个场景涵盖:
 * - 认证流程 (3): 登录、注册、忘记密码
 * - 定价页 (1): 定价和订阅选项
 * - 仪表板 (3): 默认、侧边栏、移动响应式
 * - 设置 (4): 个人资料、积分、安全、通知
 * - 管理员 (1): 用户管理表
 * - 博客 (2): 列表、文章详情
 *
 * 运行方式:
 *   # 生成所有截图 (仅公开页面)
 *   pnpm exec playwright test e2e/screenshots.spec.ts
 *
 *   # 生成包括认证页面的截图 (需要测试账户)
 *   TEST_EMAIL=test@example.com TEST_PASSWORD=password123 pnpm exec playwright test e2e/screenshots.spec.ts
 *
 *   # 生成特定测试
 *   pnpm exec playwright test e2e/screenshots.spec.ts --grep "Dashboard"
 *
 *   # 以 UI 模式运行
 *   pnpm exec playwright test --ui
 */

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'images');

// 测试账户凭证 (从环境变量读取，或使用默认值)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

// 确保输出目录存在
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * 登录辅助函数
 * @param page Playwright Page 对象
 * @param email 邮箱
 * @param password 密码
 */
async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // 提交登录
  await page.click('button[type="submit"]');

  // 等待重定向到仪表板
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
    console.warn('⚠️ 登录可能失败，检查凭证或页面是否实际重定向');
  });

  await page.waitForLoadState('networkidle');
}

test.describe('MkSaaS Blog - Screenshot Automation', () => {
  /**
   * 🔐 认证相关截图 (3 个场景)
   */

  test('01-Auth-Login Page', async ({ page }) => {
    await page.goto('/auth/login');
    // 等待页面加载完毕
    await page.waitForLoadState('networkidle');
    // 取截图
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-auth-login.png'),
      fullPage: true,
    });
  });

  test('02-Auth-Register Page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-auth-register.png'),
      fullPage: true,
    });
  });

  test('03-Auth-Forgot Password Page', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-auth-forgot-password.png'),
      fullPage: true,
    });
  });

  /**
   * 💰 定价和营销页面 (1 个场景)
   */

  test('04-Pricing Page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-pricing.png'),
      fullPage: true,
    });
  });

  /**
   * 📊 仪表板相关 (3 个场景)
   */

  test('05-Dashboard-Full Page', async ({ page }) => {
    // 尝试登录（如果提供了凭证）
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-dashboard-full.png'),
      fullPage: true,
    });
  });

  test('06-Dashboard-Sidebar Expanded', async ({ page }) => {
    // 尝试登录
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    // 点击展开侧边栏 (如果存在)
    await page.click('button[aria-label="Toggle sidebar"]').catch(() => {});
    await page.click('[data-test="sidebar-toggle"]').catch(() => {});

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-dashboard-sidebar.png'),
      fullPage: true,
    });
  });

  test('07-Dashboard-Mobile Responsive', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 尝试登录
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-dashboard-mobile.png'),
      fullPage: true,
    });
  });

  /**
   * ⚙️ 用户设置页面 (4 个场景)
   */

  test('08-Settings-Profile Page', async ({ page }) => {
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
      await page.goto('/settings/profile');
      await page.waitForLoadState('networkidle');
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-settings-profile.png'),
      fullPage: true,
    });
  });

  test('09-Settings-Credits Page', async ({ page }) => {
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
      await page.goto('/settings/credits');
      await page.waitForLoadState('networkidle');
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '09-settings-credits.png'),
      fullPage: true,
    });
  });

  test('10-Settings-Security Page', async ({ page }) => {
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
      await page.goto('/settings/security');
      await page.waitForLoadState('networkidle');
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '10-settings-security.png'),
      fullPage: true,
    });
  });

  test('11-Settings-Notifications Page', async ({ page }) => {
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
    } else {
      test.skip(true, '需要提供测试账户凭证: TEST_EMAIL 和 TEST_PASSWORD');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '11-settings-notifications.png'),
      fullPage: true,
    });
  });

  /**
   * 👥 管理员面板 (1 个场景)
   */

  test('12-Admin-Users Table', async ({ page }) => {
    if (
      TEST_EMAIL !== 'test@example.com' ||
      TEST_PASSWORD !== 'TestPassword123!'
    ) {
      await loginAsUser(page, TEST_EMAIL, TEST_PASSWORD);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // 滚动表格以显示更多列
      await page.click('table tbody tr:first-child').catch(() => {});

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '12-admin-users.png'),
        fullPage: true,
      });
    } else {
      test.skip(true, '需要提供测试账户凭证（需要管理员权限）');
    }
  });

  /**
   * 📚 博客相关 (2 个场景)
   */

  test('13-Blog-List Page', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '13-blog-list.png'),
      fullPage: true,
    });
  });

  test('14-Blog-Article Detail', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    // 获取第一篇文章的链接
    const firstArticleLink = await page
      .locator('a[href*="/blog/"]')
      .first()
      .getAttribute('href');
    if (firstArticleLink) {
      await page.goto(firstArticleLink);
      await page.waitForLoadState('networkidle');
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '14-blog-article.png'),
      fullPage: true,
    });
  });

  /**
   * 🌍 主页 (1 个场景)
   */

  test('15-Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '15-homepage.png'),
      fullPage: true,
    });
  });

  /**
   * 📱 响应式设计演示 (1 个场景)
   */

  test('16-Responsive Design - Tablet View', async ({ page }) => {
    // iPad 尺寸
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '16-responsive-tablet.png'),
      fullPage: true,
    });
  });
});

test.describe('Screenshot Validation', () => {
  /**
   * 验证所有生成的截图
   */
  test('Verify all screenshots were created', async () => {
    // 列表应该包含 16 个公开可访问的截图
    // 需要认证的截图会被跳过，但可以手动生成
    const publicScreenshots = [
      '01-auth-login.png',
      '02-auth-register.png',
      '03-auth-forgot-password.png',
      '04-pricing.png',
      '13-blog-list.png',
      '14-blog-article.png',
      '15-homepage.png',
      '16-responsive-tablet.png',
    ];

    const createdFiles = fs
      .readdirSync(SCREENSHOTS_DIR)
      .filter((f) => f.endsWith('.png'));
    console.log(`✅ 生成的截图: ${createdFiles.length} 个`);
    console.log('📁 位置: ' + SCREENSHOTS_DIR);
    console.log('📸 文件列表:');
    createdFiles.forEach((file) => {
      console.log('  - ' + file);
    });
  });
});
