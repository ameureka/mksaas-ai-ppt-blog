import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryErrorBanner } from './category-error-banner';

describe('CategoryErrorBanner', () => {
  it('Property P6: 分类页在请求失败时安全降级 - 有错误时显示提示', () => {
    render(<CategoryErrorBanner hasError>补充说明</CategoryErrorBanner>);
    expect(
      screen.getByText(/分类数据加载部分失败/).textContent
    ).toBeTruthy();
    expect(screen.getByText(/补充说明/)).toBeTruthy();
  });

  it('隐藏状态下不渲染', () => {
    render(<CategoryErrorBanner hasError={false} />);
    expect(
      screen.queryByText(/分类数据加载部分失败/)
    ).toBeNull();
  });
});
