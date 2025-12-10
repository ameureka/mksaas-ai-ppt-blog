import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mapHomeItems } from './home-map';

describe('home map defaults', () => {
  it('P4: 缺失字段时使用安全默认值', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 12 }),
            title: fc.string({ minLength: 1, maxLength: 30 }),
            downloadCount: fc.option(fc.integer({ min: 0, max: 1000 }), {
              nil: undefined,
            }),
            viewCount: fc.option(fc.integer({ min: 0, max: 5000 }), {
              nil: undefined,
            }),
            tags: fc.option(fc.array(fc.string({ maxLength: 10 })), {
              nil: undefined,
            }),
            category: fc.option(fc.string({ maxLength: 12 }), { nil: undefined }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            cover_image_url: fc.option(fc.webUrl(), { nil: undefined }),
            preview_url: fc.option(fc.webUrl(), { nil: undefined }),
            slidesCount: fc.option(fc.integer({ min: 0, max: 200 }), {
              nil: undefined,
            }),
          })
        ),
        (items) => {
          const mapped = mapHomeItems(items as any);
          mapped.forEach((ppt, idx) => {
            const source = items[idx] as any;
            expect(ppt.id).toBeTruthy();
            expect(ppt.title).toBeTruthy();
            expect(ppt.downloads).toBe(
              source.downloads ?? source.downloadCount ?? 0
            );
            expect(ppt.views).toBe(source.views ?? source.viewCount ?? 0);
            expect(Array.isArray(ppt.tags)).toBe(true);
            expect(ppt.previewUrl).toBe(
              source.preview_url ??
                source.thumbnailUrl ??
                source.cover_image_url ??
                '/placeholder.svg'
            );
            expect(ppt.category).toBe(source.category ?? '其他');
            expect(ppt.language).toBe(source.language ?? '中文');
            expect(typeof ppt.pages).toBe('number');
          });
        }
      )
    );
  });
});
