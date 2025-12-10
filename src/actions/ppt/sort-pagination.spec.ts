import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { getPPTs } from '@/actions/ppt/ppt';
import { ppt as pptTable } from '@/db/schema';
import * as drizzleOrm from 'drizzle-orm';

vi.mock('@/db', () => {
  return {
    getDb: vi.fn(),
  };
});

// mock drizzle-orm for spying orderBy/where arguments
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>(
    'drizzle-orm'
  );
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    desc: vi.fn(actual.desc),
    asc: vi.fn(actual.asc),
  };
});

const { getDb } = await import('@/db');

const asMock = <T>(fn: unknown) => fn as unknown as T;

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

  return { selectMock, rowsBuilder };
};

describe('排序与分页规则', () => {
  it('Property P3: 排序稳定且符合优先级', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<'downloads' | 'created_at' | 'title' | undefined>(
          'downloads',
          'created_at',
          'title',
          undefined
        ),
        fc.constantFrom<'asc' | 'desc' | undefined>('asc', 'desc', undefined),
        async (sortBy, sortOrder) => {
          const rows: unknown[] = [];
          const { selectMock, rowsBuilder } = buildDbStub(rows);
          asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

          const descMock = drizzleOrm.desc as unknown as vi.Mock;
          const ascMock = drizzleOrm.asc as unknown as vi.Mock;
          descMock.mockClear();
          ascMock.mockClear();

          await getPPTs({
            sortBy: sortBy,
            sortOrder: sortOrder,
          });

          expect(rowsBuilder.orderBy).toHaveBeenCalled();

          const useAsc = sortOrder === 'asc';
          const orderCalls = useAsc ? ascMock.mock.calls : descMock.mock.calls;
          const cols = orderCalls.map((c) => c[0]);

          if (sortBy === 'downloads') {
            // asc: asc(download/view) + desc(id)；desc: desc(download/view/id)
            const ascCols = ascMock.mock.calls.map((c) => c[0]);
            const descCols = descMock.mock.calls.map((c) => c[0]);
            if (useAsc) {
              expect(ascCols).toContain(pptTable.downloadCount);
              expect(ascCols).toContain(pptTable.viewCount);
              expect(descCols).toContain(pptTable.id);
            } else {
              expect(descCols).toContain(pptTable.downloadCount);
              expect(descCols).toContain(pptTable.viewCount);
              expect(descCols).toContain(pptTable.id);
            }
          } else if (sortBy === 'created_at' || sortBy === undefined) {
            const ascCols = ascMock.mock.calls.map((c) => c[0]);
            const descCols = descMock.mock.calls.map((c) => c[0]);
            if (useAsc) {
              expect(ascCols).toContain(pptTable.createdAt);
              expect(descCols).toContain(pptTable.id); // id 始终 desc 补位
            } else {
              expect(descCols).toContain(pptTable.createdAt);
              expect(descCols).toContain(pptTable.id);
            }
          } else if (sortBy === 'title') {
            const ascCols = ascMock.mock.calls.map((c) => c[0]);
            const descCols = descMock.mock.calls.map((c) => c[0]);
            if (useAsc) {
              expect(ascCols).toContain(pptTable.title);
              expect(descCols).toContain(pptTable.id);
            } else {
              expect(descCols).toContain(pptTable.title);
              expect(descCols).toContain(pptTable.id);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property P4: 分页窗口正确切分', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // rows length
        fc.integer({ min: 1, max: 5 }), // page
        fc.integer({ min: 1, max: 5 }), // pageSize
        async (rowCount, page, pageSize) => {
          const rows = Array.from({ length: rowCount }, (_, i) => ({
            id: `ppt_${i}`,
            title: `ppt ${i}`,
            category: 'business',
            fileUrl: 'x',
            status: 'published',
            downloadCount: 0,
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          const { selectMock, rowsBuilder } = buildDbStub(rows);
          asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

          await getPPTs({ page, pageSize });
          expect(rowsBuilder.limit).toHaveBeenCalledWith(
            Math.min(pageSize, 50)
          );
          expect(rowsBuilder.offset).toHaveBeenCalledWith(
            (Math.max(1, page) - 1) * Math.min(pageSize, 50)
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
