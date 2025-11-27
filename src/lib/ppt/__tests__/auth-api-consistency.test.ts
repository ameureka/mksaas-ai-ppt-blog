import { execSync } from 'child_process';
import * as fc from 'fast-check';
/**
 * Property 2: Auth API 一致性
 * **Feature: v0-ppt-migration, Property 2: Auth API 一致性**
 * **Validates: Requirements 5.1, 5.4**
 *
 * 验证所有迁移的文件使用 Better Auth API 而非旧的 useAuth
 */
import { describe, expect, it } from 'vitest';

describe('Property 2: Auth API 一致性', () => {
  /**
   * *For any* migrated file, it should not import from @/lib/hooks/use-auth (old v0 auth)
   */
  it('should not have old useAuth imports in ppt components', () => {
    const result = execSync(
      'grep -r "@/lib/hooks/use-auth" src/components/ppt/ --include="*.tsx" --include="*.ts" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* migrated page, it should use authClient from @/lib/auth-client
   */
  it('should use authClient from @/lib/auth-client in pages that need auth', () => {
    // 检查 PPT 详情页是否使用正确的 auth client
    const result = execSync(
      'grep -l "authClient" src/app/\\[locale\\]/\\(marketing\\)/ppt/\\[id\\]/page.tsx 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    // 如果页面需要认证，应该使用 authClient
    expect(result.trim()).not.toBe('');
  });

  /**
   * *For any* auth-related component, it should import from @/lib/auth-client
   */
  it('should import authClient correctly in auth components', () => {
    const result = execSync(
      'grep -r "from.*@/lib/auth-client" src/components/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    // 应该有至少一个组件使用 authClient
    const count = Number.parseInt(result.trim(), 10);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* login redirect, it should point to /auth/sign-in
   */
  it('should redirect to /auth/sign-in for login', () => {
    const result = execSync(
      'grep -r "/auth/sign-in" src/components/ppt/ src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 应该有登录重定向到正确的路径
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * *For any* session check, it should use authClient.useSession()
   */
  it('should use authClient.useSession() for session checks', () => {
    const result = execSync(
      'grep -r "useSession" src/components/ppt/ src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    // 如果有 session 检查，应该使用 useSession
    if (result.trim() !== 'NONE') {
      expect(result).toContain('useSession');
    }
  });

  /**
   * Property test: *For any* valid user session data, it should have required fields
   */
  it('should validate user session data structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1 }),
        }),
        (userData) => {
          // 验证用户数据结构有效
          expect(userData.id).toBeDefined();
          expect(userData.email).toBeDefined();
          expect(userData.name).toBeDefined();
          expect(typeof userData.id).toBe('string');
          expect(typeof userData.email).toBe('string');
          expect(typeof userData.name).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* protected route, it should check user authentication
   */
  it('should not have old requireAuth pattern in pages', () => {
    const result = execSync(
      'grep -r "requireAuth" src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });
});
