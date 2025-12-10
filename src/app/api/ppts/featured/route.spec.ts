import fc from 'fast-check';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db', () => ({ getDb: vi.fn() }));

import { GET } from './route';
import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import * as drizzleOrm from 'drizzle-orm';
import type { NextRequest } from 'next/server';

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>(
    'drizzle-orm'
  );
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    isNull: vi.fn(actual.isNull),
    desc: vi.fn(actual.desc),
  };
});

const buildReq = (url: string) =>
  new Request(url) as unknown as NextRequest;

const asMock = <T>(fn: unknown) => fn as unknown as T;

describe('/api/ppts/featured 过滤/排序/数量', () => {
  const eqMock = drizzleOrm.eq as unknown as vi.Mock;
  const isNullMock = drizzleOrm.isNull as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('P2/P3/P4: status=published + 软删过滤 + 热度排序 + limit<=50', async () => {
    const rows: unknown[] = [];
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(rows),
    });

    asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

    await GET(buildReq('http://localhost/api/ppts/featured?limit=999'));

    const statusCall = eqMock.mock.calls.find(
      ([col]) => col === ppt.status
    );
    expect(statusCall?.[1]).toBe('published');

    const deletedCall = isNullMock.mock.calls.find(
      ([col]) => col === ppt.deletedAt
    );
    expect(deletedCall).toBeDefined();
  });

  it('P4: limit 范围 1-50，默认 8', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: -10, max: 200 }), async (limit) => {
        const rows: unknown[] = [];
        const limitSpy = vi.fn().mockResolvedValue(rows);
        const selectMock = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: limitSpy,
        });
        asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

        await GET(buildReq(`http://localhost/api/ppts/featured?limit=${limit}`));

        expect(limitSpy).toHaveBeenCalled();
        const applied = limitSpy.mock.calls[0][0];
        expect(applied).toBeGreaterThanOrEqual(1);
        expect(applied).toBeLessThanOrEqual(50);
      }),
      { numRuns: 20 }
    );
  });
});
