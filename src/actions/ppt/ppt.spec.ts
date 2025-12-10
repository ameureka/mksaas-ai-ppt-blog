import fc from 'fast-check';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// mock drizzle-orm eq 以便统计调用
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>(
    'drizzle-orm'
  );
  return {
    ...actual,
    eq: vi.fn(actual.eq),
  };
});

import * as drizzleOrm from 'drizzle-orm';
import { getPPTs, createPPT, updatePPT } from '@/actions/ppt/ppt';
import { ppt as pptTable } from '@/db/schema';
import { PPT_CATEGORY_VALUES, isValidPPTCategory } from '@/lib/constants/ppt';

vi.mock('@/db', () => {
  return {
    getDb: vi.fn(),
  };
});

const { getDb } = await import('@/db');

type MockedGetDb = ReturnType<typeof vi.fn>;

const asMock = (fn: unknown) => fn as MockedGetDb;

const buildDbStub = (rows: unknown[] = []) => {
  const countBuilder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ count: rows.length }]),
  };

  const rowsBuilder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(rows),
  };

  const selectMock = vi
    .fn()
    .mockImplementation((arg?: Record<string, unknown>) =>
      arg && Object.prototype.hasOwnProperty.call(arg, 'count')
        ? countBuilder
        : rowsBuilder
    );

  return { selectMock, countBuilder, rowsBuilder };
};

describe('PPT category validation and filtering', () => {
  const eqMock = drizzleOrm.eq as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('Property P1: 非规范分类拒绝通过 (create/update)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1 })
          .filter((s) => !isValidPPTCategory(s)),
        async (invalidCategory) => {
          asMock(getDb).mockRejectedValueOnce(new Error('should not call db'));
          const createResult = await createPPT({
            title: 'demo',
            category: invalidCategory as any,
            file_url: 'http://example.com/demo.pptx',
          });
          expect(createResult.success).toBe(false);
          expect(createResult.code).toBe('VALIDATION_ERROR');

          asMock(getDb).mockRejectedValueOnce(new Error('should not call db'));
          const updateResult = await updatePPT('ppt_x', {
            category: invalidCategory as any,
          });
          expect(updateResult.success).toBe(false);
          expect(updateResult.code).toBe('VALIDATION_ERROR');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property P2: 分类过滤与软删/状态一致性（默认发布状态）', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.constantFrom(...PPT_CATEGORY_VALUES)),
        fc.option(fc.constantFrom('draft', 'published', 'archived')),
        async (categoryOpt, statusOpt) => {
          const rows: unknown[] = [];
          const { selectMock } = buildDbStub(rows);
          asMock(getDb).mockResolvedValue({ select: selectMock });

          eqMock.mockClear();
          await getPPTs({
            category: categoryOpt ?? undefined,
            status: statusOpt ?? undefined,
          });

          const statusCall = eqMock.mock.calls.find(
            ([col]) => col === pptTable.status
          );
          expect(statusCall).toBeDefined();
          expect(statusCall?.[1]).toBe(statusOpt ?? 'published');

          if (categoryOpt) {
            const categoryCall = eqMock.mock.calls.find(
              ([col]) => col === pptTable.category
            );
            expect(categoryCall).toBeDefined();
            expect(categoryCall?.[1]).toBe(categoryOpt);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
