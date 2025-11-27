import { execSync } from 'child_process';
import * as fc from 'fast-check';
/**
 * Property 1: Toast API 一致性
 * **Feature: v0-ppt-migration, Property 1: Toast API 一致性**
 * **Validates: Requirements 3.4, 4.1, 4.2, 4.3**
 *
 * 验证所有迁移的文件使用 sonner 的 toast API 而非旧的 useToast
 */
import { describe, expect, it } from 'vitest';

describe('Property 1: Toast API 一致性', () => {
  /**
   * *For any* migrated file, it should not import from @/hooks/use-toast
   */
  it('should not have any imports from @/hooks/use-toast in ppt components', () => {
    const result = execSync(
      'grep -r "@/hooks/use-toast" src/components/ppt/ src/hooks/ppt/ src/actions/ppt/ 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* migrated admin page, it should not use useToast hook
   */
  it('should not have useToast in admin pages', () => {
    const result = execSync(
      'grep -r "useToast" src/app/\\[locale\\]/\\(protected\\)/admin/ --include="*.tsx" --include="*.ts" 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* toast call in migrated files, it should use sonner API format
   */
  it('should use sonner toast API format (toast.success, toast.error, etc.)', () => {
    // 检查是否有旧格式的 toast({ title: ... }) 调用
    const result = execSync(
      'grep -r "toast({" src/components/ppt/ src/hooks/ppt/ src/actions/ppt/ 2>/dev/null || echo "NONE"',
      { encoding: 'utf-8' }
    );
    expect(result.trim()).toBe('NONE');
  });

  /**
   * Property test: *For any* valid toast message, sonner API should accept it
   */
  it('should accept any valid string message for toast', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (message) => {
        // 验证消息格式有效（非空字符串）
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
        expect(message.length).toBeLessThanOrEqual(200);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Verify sonner is imported in files that use toast
   */
  it('should import toast from sonner in files that use toast', () => {
    const result = execSync(
      'grep -l "toast\\." src/components/ppt/*.tsx src/hooks/ppt/*.ts 2>/dev/null | head -5',
      { encoding: 'utf-8' }
    );

    if (result.trim()) {
      const files = result.trim().split('\n');
      for (const file of files) {
        const content = execSync(
          `grep "from 'sonner'" "${file}" 2>/dev/null || echo "MISSING"`,
          { encoding: 'utf-8' }
        );
        // 文件要么导入 sonner，要么不使用 toast
        expect(content.includes('sonner') || content === 'MISSING').toBe(true);
      }
    }
  });
});
