import fc from 'fast-check';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/embedding', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2]),
  generateEmbeddingInput: vi.fn().mockReturnValue('query'),
}));

import { hybridSearch, recordSearchLog } from './search';
import { ppt } from '@/db/schema';
import * as drizzleOrm from 'drizzle-orm';
import { getDb } from '@/db';
import { generateEmbedding } from '@/lib/embedding';

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>(
    'drizzle-orm'
  );
  return {
    ...actual,
    and: vi.fn(actual.and),
    isNull: vi.fn(actual.isNull),
    eq: vi.fn(actual.eq),
    sql: actual.sql,
    desc: vi.fn(actual.desc),
  };
});

const asMock = <T>(fn: unknown) => fn as unknown as T;

const buildDbStub = (rows: unknown[] = []) => {
  const selectMock = vi
    .fn()
    .mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(rows),
    });

  return { selectMock };
};

describe('hybridSearch 过滤与降级', () => {
  const isNullMock = drizzleOrm.isNull as unknown as vi.Mock;
  const eqMock = drizzleOrm.eq as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('P2: SQL 补足/降级时仍过滤软删', async () => {
    const rows: unknown[] = [];
    const { selectMock } = buildDbStub(rows);
    asMock<typeof getDb>(getDb).mockResolvedValue({
      select: selectMock,
      execute: vi.fn().mockResolvedValue(rows),
    });

    await hybridSearch('test', 5);

    expect(isNullMock).toHaveBeenCalledWith(ppt.deletedAt);
    const statusCall = eqMock.mock.calls.find(
      ([col]) => col === ppt.status
    );
    expect(statusCall?.[1]).toBe('published');
  });

  it('P3: 向量不足阈值时补 SQL，向量失败降级 SQL', async () => {
    const vectorRows: unknown[] = [{ id: 'ppt1' }];
    const sqlRows: unknown[] = [{ id: 'ppt2' }];

    // 第一次 select 用于向量 → 返回1条；SQL 分支 select 再返回 sqlRows
    const selectMock = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(vectorRows),
      })
      .mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(sqlRows),
      });

    asMock<typeof getDb>(getDb).mockResolvedValue({
      select: selectMock,
      execute: vi.fn().mockResolvedValue(vectorRows),
    });

    const { results, searchType } = await hybridSearch('test', 5);
    expect(results.length).toBeGreaterThanOrEqual(vectorRows.length);
    expect(searchType === 'hybrid' || searchType === 'vector').toBe(true);
  });

  it('P6: 向量搜索失败时自动降级 SQL', async () => {
    const sqlRows: unknown[] = [{ id: 'sql-only' }];

    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(sqlRows),
    };

    asMock<typeof getDb>(getDb).mockResolvedValue({
      select: vi.fn().mockReturnValue(selectChain),
      execute: vi.fn(),
    });

    asMock<typeof generateEmbedding>(generateEmbedding).mockRejectedValueOnce(
      new Error('embedding failed')
    );

    const { results, searchType } = await hybridSearch('test', 5);
    expect(searchType).toBe('sql');
    expect(results).toEqual(sqlRows);
  });
});

describe('recordSearchLog', () => {
  it('P5: 记录搜索日志字段完整', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    asMock<typeof getDb>(getDb).mockResolvedValue({
      insert: insertMock,
    } as any);

    await recordSearchLog({
      keyword: '新能源',
      resultCount: 3,
      searchType: 'hybrid',
      durationMs: 120,
      ipAddress: '1.1.1.1',
      userAgent: 'vitest',
      source: 'home_search',
    });

    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledTimes(1);
    const payload = valuesMock.mock.calls[0]?.[0];
    expect(payload.keyword).toBe('新能源');
    expect(payload.resultCount).toBe(3);
    expect(payload.searchType).toBe('hybrid');
    expect(payload.durationMs).toBe(120);
    expect(payload.ipAddress).toBe('1.1.1.1');
    expect(payload.userAgent).toBe('vitest');
    expect(payload.source).toBe('home_search');
  });
});
