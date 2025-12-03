import { OutstreamVideoAd } from '@/components/ads';
import React, { Children, isValidElement } from 'react';

interface InjectAdsOptions {
  minParagraphs: number;
  firstAdAfter: number;
  adInterval: number;
  maxAds: number;
}

const defaultOptions: InjectAdsOptions = {
  minParagraphs: 5,
  firstAdAfter: 2,
  adInterval: 4,
  maxAds: 2,
};

export function injectAdsIntoContent(
  children: React.ReactNode,
  options: Partial<InjectAdsOptions> = {}
): React.ReactNode {
  const opts = { ...defaultOptions, ...options };
  const childArray = Children.toArray(children);

  // Count paragraphs
  const paragraphIndices: number[] = [];
  childArray.forEach((child, index) => {
    if (isValidElement(child) && child.type === 'p') {
      paragraphIndices.push(index);
    }
  });

  // Not enough paragraphs
  if (paragraphIndices.length < opts.minParagraphs) {
    return children;
  }

  // Determine how many ads to inject based on paragraph count
  const totalParagraphs = paragraphIndices.length;
  const adsToInject = totalParagraphs < 10 ? 1 : Math.min(opts.maxAds, 2);

  const result: React.ReactNode[] = [...childArray];
  let adsInserted = 0;
  let lastAdParagraph = -opts.adInterval;

  // Find positions to insert ads
  const insertPositions: number[] = [];

  for (
    let i = 0;
    i < paragraphIndices.length && adsInserted < adsToInject;
    i++
  ) {
    const paragraphNum = i + 1;

    if (
      paragraphNum >= opts.firstAdAfter &&
      paragraphNum - lastAdParagraph >= opts.adInterval
    ) {
      insertPositions.push(paragraphIndices[i]);
      lastAdParagraph = paragraphNum;
      adsInserted++;
    }
  }

  // Insert ads in reverse order to maintain indices
  insertPositions.reverse().forEach((position, idx) => {
    const adKey = `injected-ad-${insertPositions.length - idx - 1}`;
    result.splice(
      position + 1,
      0,
      React.createElement(OutstreamVideoAd, { key: adKey, className: 'my-8' })
    );
  });

  return result;
}
