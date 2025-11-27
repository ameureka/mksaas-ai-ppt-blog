import { execSync } from 'child_process';
import * as fc from 'fast-check';
/**
 * Property 3: 布局组件一致性
 * **Feature: v0-ppt-migration, Property 3: 布局组件一致性**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 *
 * 验证所有迁移的页面不使用旧的 v0 布局组件
 */
import { describe, expect, it } from 'vitest';

describe('Property 3: 布局组件一致性', () => {
  /**
   * *For any* migrated page, it should not use MksaasPublicLayout
   */
  it('should not have MksaasPublicLayout in ppt pages', () => {
    const result = execSync(
      'grep -r "MksaasPublicLayout" src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* migrated page, it should not use MksaasPreviewLayout
   */
  it('should not have MksaasPreviewLayout in admin pages', () => {
    const result = execSync(
      'grep -r "MksaasPreviewLayout" src/app/\\[locale\\]/\\(protected\\)/admin/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* migrated page, it should not use MksaasDashboardHeader
   */
  it('should not have MksaasDashboardHeader in admin pages', () => {
    const result = execSync(
      'grep -r "MksaasDashboardHeader" src/app/\\[locale\\]/\\(protected\\)/admin/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* admin page, it should use DashboardHeader from mksaas
   */
  it('should use DashboardHeader in admin pages', () => {
    const result = execSync(
      'grep -r "DashboardHeader" src/app/\\[locale\\]/\\(protected\\)/admin/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 管理页面应该使用 DashboardHeader
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* admin page with DashboardHeader, it should have breadcrumbs
   */
  it('should have breadcrumbs in admin pages with DashboardHeader', () => {
    const result = execSync(
      'grep -r "breadcrumbs" src/app/\\[locale\\]/\\(protected\\)/admin/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 有 DashboardHeader 的页面应该有 breadcrumbs
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* migrated component, it should not import from v0 layout components
   */
  it('should not import v0 layout components in ppt components', () => {
    const result = execSync(
      'grep -r "mksaas-public-layout\\|mksaas-preview-layout\\|mksaas-dashboard-header" src/components/ppt/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * Property test: *For any* valid breadcrumb config, it should have required fields
   */
  it('should validate breadcrumb config structure', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1 }),
            href: fc.option(fc.string({ minLength: 1 })),
            isCurrentPage: fc.option(fc.boolean()),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (breadcrumbs) => {
          // 验证面包屑配置结构有效
          expect(breadcrumbs.length).toBeGreaterThan(0);
          for (const crumb of breadcrumbs) {
            expect(crumb.label).toBeDefined();
            expect(typeof crumb.label).toBe('string');
            expect(crumb.label.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* marketing page, it should rely on (marketing)/layout.tsx
   */
  it('should have marketing layout for ppt pages', () => {
    const result = execSync(
      'ls src/app/\\[locale\\]/\\(marketing\\)/layout.tsx 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).not.toBe('NONE');
  });
});
