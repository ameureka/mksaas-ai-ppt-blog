import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/navigation', () => ({
  LocaleLink: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import { PPTCard } from './ppt-card';

const basePpt = {
  id: 'ppt-1',
  title: '企业培训',
  category: 'business',
  downloads: 0,
  views: 0,
  pages: 0,
};

describe('PPTCard', () => {
  it('fallbacks to category label when tags are empty', () => {
    render(<PPTCard ppt={{ ...basePpt, tags: [] }} onDownload={() => {}} />);
    expect(screen.getByText('商务汇报')).toBeTruthy();
  });

  it('formats counts with integer for <1000 and k for >=1000', () => {
    render(
      <PPTCard
        ppt={{ ...basePpt, downloads: 850, views: 1500 }}
        onDownload={() => {}}
      />
    );
    expect(screen.getByText('850')).toBeTruthy();
    expect(screen.getByText('1.5k')).toBeTruthy();
  });

  it('triggers onDownload when clicking button', () => {
    const handler = vi.fn();
    render(<PPTCard ppt={basePpt} onDownload={handler} />);
    fireEvent.click(screen.getByText('立即下载'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('renders ad placeholder when isAd=true', () => {
    render(
      <PPTCard ppt={{ ...basePpt, isAd: true, title: 'Ad' }} onDownload={() => {}} />
    );
    expect(screen.getByText('推广内容')).toBeTruthy();
  });
});
