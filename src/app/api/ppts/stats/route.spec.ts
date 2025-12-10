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
    and: vi.fn(actual.and),
  };
});

const buildReq = (url: string) =>
  new Request(url) as unknown as NextRequest;

const asMock = <T>(fn: unknown) => fn as unknown as T;

describe('/api/ppts/stats 过滤与缓存头', () => {
  const eqMock = drizzleOrm.eq as unknown as vi.Mock;
  const isNullMock = drizzleOrm.isNull as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('P1: 仅统计发布 + 未软删', async () => {
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([]),
    });
    asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

    const res = await GET(buildReq('http://localhost/api/ppts/stats'));
    expect(eqMock).toHaveBeenCalledWith(ppt.status, 'published');
    expect(isNullMock).toHaveBeenCalledWith(ppt.deletedAt);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('P5: 返回包含缓存头', async () => {
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([]),
    });
    asMock<typeof getDb>(getDb).mockResolvedValue({ select: selectMock });

    const res = await GET(buildReq('http://localhost/api/ppts/stats'));
    expect(res.headers.get('Cache-Control')).toContain('s-maxage');
  });
});
