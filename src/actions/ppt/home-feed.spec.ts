import fc from 'fast-check';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => {
  return {
    getDb: vi.fn(),
  };
});

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>(
    'drizzle-orm'
  );
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    isNull: vi.fn(actual.isNull),
  };
});

import * as drizzleOrm from 'drizzle-orm';
import { getPPTs } from '@/actions/ppt/ppt';
import { ppt as pptTable } from '@/db/schema';

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

  return { selectMock, rowsBuilder, countBuilder };
};

describe('首页 feed 过滤与限额', () => {
  const eqMock = drizzleOrm.eq as unknown as vi.Mock;
  const isNullMock = drizzleOrm.isNull as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('P2: 后端过滤发布且未软删（默认 status=published 且包含软删条件）', async () => {
    const { selectMock } = buildDbStub([]);
    asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

    await getPPTs({});

    const statusCall = eqMock.mock.calls.find(
      ([col]) => col === pptTable.status
    );
    expect(statusCall?.[1]).toBe('published');

    expect(isNullMock).toHaveBeenCalled();
    const deletedCall = isNullMock.mock.calls.find(
      ([col]) => col === pptTable.deletedAt
    );
    expect(deletedCall).toBeDefined();
  });

  it('P5: 数量限制符合 pageSize（首页精选 8 条场景）', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (pageSize) => {
        const { selectMock, rowsBuilder } = buildDbStub([]);
        asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

        await getPPTs({
          sortBy: 'downloads',
          sortOrder: 'desc',
          page: 1,
          pageSize,
        });

        expect(rowsBuilder.limit).toHaveBeenCalledWith(pageSize);
      }),
      { numRuns: 30 }
    );
  });
});
