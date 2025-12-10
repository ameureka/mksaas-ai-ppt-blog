import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mergeCategoryStats, sortCategoriesByCount } from './home-categories-map';
import { PPT_CATEGORIES } from '@/lib/constants/ppt';

describe('home categories mapping', () => {
  it('P2: 缺失分类回退为0，不抛错', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.nat()),
        (rawStats) => {
          const categories = mergeCategoryStats(rawStats);
          // 所有配置分类都存在且 count 不为 undefined
          PPT_CATEGORIES.forEach((cat) => {
            const entry = categories.find((c) => c.slug === cat.value);
            expect(entry).toBeDefined();
            expect(entry!.count).toBeDefined();
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('P3: 按数量降序排序，同值保持配置顺序', () => {
    const stats = {
      business: 10,
      education: 5,
      technology: 5,
    };
    const sorted = sortCategoriesByCount(mergeCategoryStats(stats));
    expect(sorted[0].slug).toBe('business');
    // education 在配置中优先于 technology
    const order = sorted
      .slice(1, 3)
      .map((c) => c.slug)
      .join(',');
    expect(order).toBe('education,technology');
  });
});
