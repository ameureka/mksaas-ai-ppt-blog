import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturedErrorBanner } from './featured-error-banner';

describe('FeaturedErrorBanner', () => {
  it('P7: 有错误时显示提示', () => {
    render(<FeaturedErrorBanner hasError>补充说明</FeaturedErrorBanner>);
    expect(
      screen.getByText(/精选数据加载失败/).textContent
    ).toBeTruthy();
    expect(screen.getByText(/补充说明/)).toBeTruthy();
  });

  it('无错误时不渲染', () => {
    render(<FeaturedErrorBanner hasError={false} />);
    expect(
      screen.queryByText(/精选数据加载失败/)
    ).toBeNull();
  });
});
