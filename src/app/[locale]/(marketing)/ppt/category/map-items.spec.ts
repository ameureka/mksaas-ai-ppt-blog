import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mapCategoryItems } from './map-items';

describe('mapCategoryItems', () => {
  it('Property P5: 前端字段映射保持值一致', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          category: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
          preview_url: fc.option(fc.webUrl(), { nil: undefined }),
          cover_image_url: fc.option(fc.webUrl(), { nil: undefined }),
          downloads: fc.option(fc.nat(), { nil: undefined }),
          downloadCount: fc.option(fc.nat(), { nil: undefined }),
          download_count: fc.option(fc.nat(), { nil: undefined }),
          views: fc.option(fc.nat(), { nil: undefined }),
          viewCount: fc.option(fc.nat(), { nil: undefined }),
          view_count: fc.option(fc.nat(), { nil: undefined }),
          slides_count: fc.option(fc.nat(), { nil: undefined }),
          slidesCount: fc.option(fc.nat(), { nil: undefined }),
          language: fc.option(fc.string(), { nil: undefined }),
          tags: fc.option(fc.array(fc.string()), { nil: undefined }),
        }),
        (raw) => {
          const [mapped] = mapCategoryItems([raw], 'fallback');
          expect(mapped.id).toBe(raw.id);
          expect(mapped.title).toBe(raw.title);
          expect(mapped.category).toBe(raw.category ?? 'fallback');
          expect(mapped.subcategory).toBe(raw.category ?? 'fallback');

          const expectedDownloads =
            raw.downloads ??
            raw.downloadCount ??
            raw.download_count ??
            0;
          expect(mapped.downloads).toBe(expectedDownloads);

          const expectedViews = raw.views ?? raw.viewCount ?? raw.view_count ?? 0;
          expect(mapped.views).toBe(expectedViews);

          const expectedSlides = raw.slides_count ?? raw.slidesCount ?? 0;
          expect(mapped.slides).toBe(expectedSlides);
          expect(mapped.pages).toBe(expectedSlides);

          expect(mapped.language).toBe(raw.language ?? '中文');
          expect(mapped.tags).toEqual(raw.tags ?? []);

          const expectedThumb =
            raw.thumbnailUrl ??
            raw.preview_url ??
            raw.cover_image_url ??
            '/placeholder.svg';
          expect(mapped.thumbnail).toBe(expectedThumb);
          expect(mapped.previewUrl).toBe(expectedThumb);
        }
      ),
      { numRuns: 50 }
    );
  });
});
