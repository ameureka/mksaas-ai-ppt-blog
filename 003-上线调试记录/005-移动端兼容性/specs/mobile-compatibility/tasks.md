# Implementation Plan: Mobile Compatibility

- [ ] 1. 修复 Footer 组件字体大小
  - 将所有 `text-xs` (12px) 替换为 `text-sm` (14px)
  - 涉及：描述文字、统计数据、合作伙伴链接、版权文字
  - _Requirements: 1.1, 1.3_

- [ ]* 1.1 编写属性测试: 移动端最小字体
  - **Property 1: Minimum font size on mobile**
  - **Validates: Requirements 1.1**

- [ ] 2. 修复 Footer 社交图标触摸目标
  - 将社交图标从 `h-8 w-8` (32px) 改为 `h-11 w-11` (44px)
  - 将图标间距从 `gap-2` (8px) 改为 `gap-3` (12px)
  - _Requirements: 2.1, 2.2_

- [ ]* 2.1 编写属性测试: 社交图标尺寸
  - **Property 2: Social icon touch target size**
  - **Validates: Requirements 2.1**

- [ ]* 2.2 编写属性测试: 社交图标间距
  - **Property 3: Social icon spacing**
  - **Validates: Requirements 2.2**

- [ ] 3. 优化 Footer 链接间距
  - 将导航链接间距从 `space-y-2` (8px) 改为 `space-y-3` (12px)
  - 应用到所有导航列表（Categories, Resources, Support, About）
  - _Requirements: 3.1, 3.2_

- [ ]* 3.1 编写属性测试: 链接垂直间距
  - **Property 5: Link vertical spacing on mobile**
  - **Validates: Requirements 3.1**

- [ ]* 3.2 编写属性测试: 链接触摸目标高度
  - **Property 6: Link touch target height**
  - **Validates: Requirements 3.2**

- [ ] 4. Checkpoint - 验证 Footer 修改
  - 在本地启动开发服务器
  - 使用浏览器开发工具测试 320px, 375px, 768px 视口
  - 确认所有文字可读，图标可点击
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. 编写属性测试: 无横向滚动
  - **Property 4: No horizontal overflow at minimum viewport**
  - **Validates: Requirements 1.4, 4.4**

- [ ]* 6. 编写属性测试: 文字对比度
  - **Property 7: Text contrast ratio**
  - **Validates: Requirements 3.3**

- [ ]* 7. 编写属性测试: 响应式列布局
  - **Property 8: Responsive column layout**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 8. 编写单元测试: Footer 组件
  - 测试组件渲染所有导航区域
  - 测试 Tailwind 响应式类正确应用
  - 测试社交链接条件渲染
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 9. Checkpoint - 确保所有测试通过
  - 运行所有属性测试和单元测试
  - 修复任何失败的测试
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. 验证核心页面移动端兼容性
  - 创建 Playwright 测试脚本验证 P0 页面
  - 测试首页、PPT 列表、PPT 详情、博客列表、博客详情
  - 验证字体大小、触摸目标、响应式布局
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 11. 运行性能测试
  - 使用 Lighthouse 测试移动端性能
  - 验证 LCP < 2.5s, FID < 100ms, CLS < 0.1
  - 在 3G 网络条件下测试加载时间
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. 最终 Checkpoint - 生产就绪验证
  - 在真实移动设备上测试（iOS 和 Android）
  - 验证所有 48 页的 Footer 显示正确
  - 确认符合 Google AdSense 移动端要求
  - Ensure all tests pass, ask the user if questions arise.
