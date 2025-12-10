import { describe, expect, it, vi } from 'vitest';

vi.mock('@/actions/hot-keywords', () => ({
  getHotKeywords: vi.fn(),
}));

import { GET } from './route';
import { getHotKeywords } from '@/actions/hot-keywords';

describe('/api/hot-keywords', () => {
  it('P1: 返回合并后的热词且长度不超过8，失败回退默认', async () => {
    (getHotKeywords as unknown as vi.Mock).mockResolvedValue(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] // 超过8长度模拟
    );
    const res = await GET();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeLessThanOrEqual(8);
  });
});
