import type * as React from 'react';
import { Children, createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { injectAdsIntoContent } from '../inject-ads';

/**
 * Property 6: Ad injection respects paragraph count
 *
 * For any React children array with N paragraph elements:
 * - If N < 5: inject 0 ads
 * - If 5 <= N < 10: inject 1 ad after paragraph 2-3
 * - If N >= 10: inject 2 ads with at least 4 paragraphs spacing
 * - Never inject more than 2 ads
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

// Helper to count ads in children
function countAdsInChildren(children: React.ReactNode): number {
  const childArray = Children.toArray(children);
  return childArray.filter(
    (child: any) => child?.type?.name === 'OutstreamVideoAd'
  ).length;
}

// Helper to create paragraph elements
function createParagraphs(count: number): React.ReactNode[] {
  return Array.from({ length: count }, (_, i) =>
    createElement('p', { key: i }, `Paragraph ${i + 1}`)
  );
}

describe('injectAdsIntoContent - Property 6: Ad injection rules', () => {
  describe('Requirement 7.4: Articles with fewer than 5 paragraphs', () => {
    it('should not inject ads when there are 0 paragraphs', () => {
      const children = [];
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(0);
    });

    it('should not inject ads when there are 4 paragraphs', () => {
      const children = createParagraphs(4);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(0);
    });

    it('should not inject ads with mixed content (< 5 paragraphs)', () => {
      const children = [
        createElement('h1', { key: 'h1' }, 'Title'),
        createElement('p', { key: 'p1' }, 'Paragraph 1'),
        createElement('div', { key: 'div' }, 'Content'),
        createElement('p', { key: 'p2' }, 'Paragraph 2'),
        createElement('p', { key: 'p3' }, 'Paragraph 3'),
      ];
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(0);
    });
  });

  describe('Requirement 7.1: Articles with 5-9 paragraphs', () => {
    it('should inject 1 ad when there are exactly 5 paragraphs', () => {
      const children = createParagraphs(5);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(1);
    });

    it('should inject 1 ad when there are 7 paragraphs', () => {
      const children = createParagraphs(7);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(1);
    });

    it('should inject 1 ad when there are 9 paragraphs', () => {
      const children = createParagraphs(9);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(1);
    });

    it('should inject ad after 2nd-3rd paragraph', () => {
      const children = createParagraphs(5);
      const result = Children.toArray(injectAdsIntoContent(children));

      // Find ad position
      const adIndex = result.findIndex(
        (child: any) => child?.type?.name === 'OutstreamVideoAd'
      );

      // Ad should be after paragraph 2 or 3 (index 2 or 3)
      expect(adIndex).toBeGreaterThanOrEqual(2);
      expect(adIndex).toBeLessThanOrEqual(3);
    });
  });

  describe('Requirement 7.2: Articles with 10+ paragraphs', () => {
    it('should inject 2 ads when there are exactly 10 paragraphs', () => {
      const children = createParagraphs(10);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(2);
    });

    it('should inject 2 ads when there are 15 paragraphs', () => {
      const children = createParagraphs(15);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(2);
    });

    it('should inject 2 ads when there are 20 paragraphs', () => {
      const children = createParagraphs(20);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(2);
    });

    it('should maintain at least 4 paragraphs spacing between ads', () => {
      const children = createParagraphs(15);
      const result = Children.toArray(injectAdsIntoContent(children));

      // Find ad positions
      const adIndices = result
        .map((child: any, index) =>
          child?.type?.name === 'OutstreamVideoAd' ? index : -1
        )
        .filter((index) => index !== -1);

      expect(adIndices).toHaveLength(2);

      // Count paragraphs between ads
      const paragraphsBetween = result
        .slice(adIndices[0] + 1, adIndices[1])
        .filter((child: any) => child?.type === 'p').length;

      expect(paragraphsBetween).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Requirement 7.3: Maximum 2 ads per article', () => {
    it('should not inject more than 2 ads even with 50 paragraphs', () => {
      const children = createParagraphs(50);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(2);
    });

    it('should not inject more than 2 ads even with 100 paragraphs', () => {
      const children = createParagraphs(100);
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      const result = injectAdsIntoContent(null);
      expect(countAdsInChildren(result)).toBe(0);
    });

    it('should handle non-paragraph elements', () => {
      const children = [
        createElement('h1', { key: 'h1' }, 'Title'),
        createElement('div', { key: 'div' }, 'Content'),
        createElement('span', { key: 'span' }, 'Text'),
      ];
      const result = injectAdsIntoContent(children);
      expect(countAdsInChildren(result)).toBe(0);
    });

    it('should preserve non-paragraph elements', () => {
      const children = [
        createElement('h1', { key: 'h1' }, 'Title'),
        ...createParagraphs(5),
        createElement('div', { key: 'div' }, 'Content'),
      ];
      const result = Children.toArray(injectAdsIntoContent(children));

      // Should still have h1 and div
      expect(result.some((child: any) => child?.type === 'h1')).toBe(true);
      expect(result.some((child: any) => child?.type === 'div')).toBe(true);
    });

    it('should handle custom options', () => {
      const children = createParagraphs(10);
      const result = injectAdsIntoContent(children, {
        minParagraphs: 8,
        firstAdAfter: 3,
        adInterval: 5,
        maxAds: 1,
      });
      expect(countAdsInChildren(result)).toBe(1);
    });
  });

  describe('Comprehensive property-based scenarios', () => {
    const testCases = [
      { paragraphs: 0, expected: 0, description: '0 paragraphs' },
      { paragraphs: 1, expected: 0, description: '1 paragraph' },
      { paragraphs: 2, expected: 0, description: '2 paragraphs' },
      { paragraphs: 3, expected: 0, description: '3 paragraphs' },
      { paragraphs: 4, expected: 0, description: '4 paragraphs' },
      { paragraphs: 5, expected: 1, description: '5 paragraphs (boundary)' },
      { paragraphs: 6, expected: 1, description: '6 paragraphs' },
      { paragraphs: 7, expected: 1, description: '7 paragraphs' },
      { paragraphs: 8, expected: 1, description: '8 paragraphs' },
      { paragraphs: 9, expected: 1, description: '9 paragraphs' },
      { paragraphs: 10, expected: 2, description: '10 paragraphs (boundary)' },
      { paragraphs: 11, expected: 2, description: '11 paragraphs' },
      { paragraphs: 15, expected: 2, description: '15 paragraphs' },
      { paragraphs: 20, expected: 2, description: '20 paragraphs' },
      { paragraphs: 30, expected: 2, description: '30 paragraphs' },
    ];

    testCases.forEach(({ paragraphs, expected, description }) => {
      it(`should inject ${expected} ad(s) for ${description}`, () => {
        const children = createParagraphs(paragraphs);
        const result = injectAdsIntoContent(children);
        expect(countAdsInChildren(result)).toBe(expected);
      });
    });
  });
});
