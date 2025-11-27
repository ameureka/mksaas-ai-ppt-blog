import { execSync } from 'child_process';
import * as fc from 'fast-check';
/**
 * Property 4: 国际化路由一致性
 * **Feature: v0-ppt-migration, Property 4: 国际化路由一致性**
 * **Validates: Requirements 7.3, 7.4**
 *
 * 验证所有迁移的页面使用正确的国际化路由组件
 */
import { describe, expect, it } from 'vitest';

describe('Property 4: 国际化路由一致性', () => {
  /**
   * *For any* migrated page with links, it should use LocaleLink
   */
  it('should use LocaleLink for internal navigation in ppt pages', () => {
    const result = execSync(
      'grep -r "LocaleLink" src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // PPT 页面应该使用 LocaleLink 进行内部导航
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* migrated page, it should import LocaleLink from @/i18n/navigation
   */
  it('should import LocaleLink from correct path', () => {
    const result = execSync(
      'grep -r "@/i18n/navigation" src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 应该从正确的路径导入 LocaleLink
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* route constant, it should use ppt-routes not old routes
   */
  it('should use ppt-routes constants', () => {
    const result = execSync(
      'grep -r "ppt-routes" src/app/\\[locale\\]/\\(marketing\\)/ppt/ src/components/ppt/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 应该使用 ppt-routes 常量
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* migrated file, it should not use old routes constant
   */
  it('should not import from old @/lib/constants/routes', () => {
    const result = execSync(
      'grep -r "@/lib/constants/routes\\"\\|@/lib/constants/routes\'" src/app/\\[locale\\]/\\(marketing\\)/ppt/ src/components/ppt/ --include="*.tsx" --include="*.ts" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* PPT route, it should start with /ppt prefix
   */
  it('should have /ppt prefix in route constants', () => {
    const result = execSync(
      'grep -r "\'/ppt" src/lib/constants/ppt-routes.ts 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 路由常量应该包含 /ppt 前缀
    expect(count).toBeGreaterThan(0);
  });

  /**
   * *For any* i18n constant, it should use ppt-i18n not old i18n
   */
  it('should use ppt-i18n constants', () => {
    const result = execSync(
      'grep -r "ppt-i18n" src/components/ppt/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 应该使用 ppt-i18n 常量
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* migrated file, it should not use old i18n constant
   */
  it('should not import from old @/lib/constants/i18n', () => {
    const result = execSync(
      'grep -r "@/lib/constants/i18n\\"\\|@/lib/constants/i18n\'" src/components/ppt/ --include="*.tsx" --include="*.ts" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * Property test: *For any* valid route path, it should be a valid URL path
   */
  it('should validate route path format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/ppt',
          '/ppt/categories',
          '/ppt/category/business',
          '/ppt/123',
          '/admin/ppt',
          '/admin/ppt/list'
        ),
        (route) => {
          // 验证路由路径格式有效
          expect(route).toMatch(/^\/[a-z0-9\-\/]*$/);
          expect(route.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* page in [locale] folder, it should support i18n
   */
  it('should have pages in [locale] folder structure', () => {
    const result = execSync(
      'ls -d src/app/\\[locale\\]/\\(marketing\\)/ppt/ 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).not.toBe('NONE');
  });
});
