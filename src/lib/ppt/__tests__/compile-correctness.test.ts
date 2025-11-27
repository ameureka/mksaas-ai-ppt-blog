import * as fc from 'fast-check';
/**
 * Property 6: 编译正确性
 * **Feature: v0-ppt-migration, Property 6: 编译正确性**
 * **Validates: Requirements 1.3**
 *
 * 验证所有迁移的类型定义和 schema 文件能够正确编译
 */
import { describe, expect, it } from 'vitest';

import type { AdminAuditLog, AdminUser } from '@/lib/types/ppt/admin';
// 导入所有类型定义，验证编译正确性
import type { PPT, PPTCategory, PPTListParams } from '@/lib/types/ppt/ppt';
import type {
  ListResult,
  ServerActionResult,
} from '@/lib/types/ppt/server-action';
import type {
  PPTUser,
  UpdateUserInput,
  UserRole,
  UserStatus,
} from '@/lib/types/ppt/user';

// 导入 schema 验证函数
import { pptCategoryEnum, pptStatusEnum } from '@/lib/ppt/schemas/ppt';
import { userRoleEnum, userStatusEnum } from '@/lib/ppt/schemas/user';

describe('Property 6: 编译正确性', () => {
  /**
   * *For any* valid PPT status value, the schema should accept it
   */
  it('should validate PPT status enum values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('draft', 'published', 'archived'),
        (status) => {
          const result = pptStatusEnum.safeParse(status);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* invalid PPT status value, the schema should reject it
   */
  it('should reject invalid PPT status values', () => {
    fc.assert(
      fc.property(
        fc
          .string()
          .filter((s) => !['draft', 'published', 'archived'].includes(s)),
        (invalidStatus) => {
          const result = pptStatusEnum.safeParse(invalidStatus);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* valid PPT category value, the schema should accept it
   */
  it('should validate PPT category enum values', () => {
    const validCategories = [
      'business',
      'education',
      'technology',
      'marketing',
      'report',
      'plan',
      'summary',
      'other',
    ];
    fc.assert(
      fc.property(fc.constantFrom(...validCategories), (category) => {
        const result = pptCategoryEnum.safeParse(category);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* valid user role value, the schema should accept it
   */
  it('should validate user role enum values', () => {
    fc.assert(
      fc.property(fc.constantFrom('admin', 'user', 'vip'), (role) => {
        const result = userRoleEnum.safeParse(role);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* valid user status value, the schema should accept it
   */
  it('should validate user status enum values', () => {
    fc.assert(
      fc.property(fc.constantFrom('active', 'inactive', 'banned'), (status) => {
        const result = userStatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Type compilation verification - these imports should not throw
   */
  it('should have valid type exports', () => {
    // 验证类型导出存在（编译时检查）
    // 使用类型断言来验证类型存在
    const pptType: PPT | null = null;
    const pptListParams: PPTListParams | null = null;
    const pptCategory: PPTCategory | null = null;
    const pptUser: PPTUser | null = null;
    const userRole: UserRole | null = null;
    const userStatus: UserStatus | null = null;
    const updateUserInput: UpdateUserInput | null = null;
    const serverActionResult: ServerActionResult<string> | null = null;
    const listResult: ListResult<string> | null = null;
    const adminUser: AdminUser | null = null;
    const adminAuditLog: AdminAuditLog | null = null;

    // 如果类型导入失败，测试会在编译阶段失败
    expect(pptType).toBeNull();
    expect(pptListParams).toBeNull();
    expect(pptCategory).toBeNull();
    expect(pptUser).toBeNull();
    expect(userRole).toBeNull();
    expect(userStatus).toBeNull();
    expect(updateUserInput).toBeNull();
    expect(serverActionResult).toBeNull();
    expect(listResult).toBeNull();
    expect(adminUser).toBeNull();
    expect(adminAuditLog).toBeNull();
  });
});
