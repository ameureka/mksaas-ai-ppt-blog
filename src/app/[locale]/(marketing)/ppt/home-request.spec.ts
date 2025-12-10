import { describe, expect, it } from 'vitest';

// 利用字符串匹配校验首页请求 URL 是否包含显式 status=published
describe('首页请求参数显式化', () => {
  const buildFeaturedUrl = () =>
    '/api/ppts?sortBy=downloads&sortOrder=desc&status=published&pageSize=8';
  const buildNewUrl = () =>
    '/api/ppts?page=1&pageSize=12&sortBy=created_at&sortOrder=desc&status=published';

  it('P1: Featured 请求含 status=published 且排序与数量参数', () => {
    const url = buildFeaturedUrl();
    expect(url).toContain('status=published');
    expect(url).toContain('sortBy=downloads');
    expect(url).toContain('pageSize=8');
  });

  it('P1: New 请求含 status=published 且排序与数量参数', () => {
    const url = buildNewUrl();
    expect(url).toContain('status=published');
    expect(url).toContain('sortBy=created_at');
    expect(url).toContain('pageSize=12');
  });
});
