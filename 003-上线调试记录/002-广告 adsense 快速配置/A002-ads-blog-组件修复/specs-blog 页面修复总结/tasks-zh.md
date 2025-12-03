# 实施计划：广告系统增强

- [x] 1. 扩展 ADSENSE_CONFIG 添加新广告位类型
  - 在 `src/lib/config/adsense.ts` 的 slots 对象中添加 vertical、outstream、multiplex、anchor
  - 在 `env.example` 中添加相应的环境变量
  - _需求：5.1、5.3、5.4_

- [ ]* 1.1 编写属性测试：配置完整性
  - **属性 5：配置完整性**
  - **验证：需求 5.1、5.3、5.4**

- [x] 2. 扩展 DisplayAd 组件添加新格式
- [x] 2.1 添加新的 AdFormat 类型和尺寸
  - 在 `src/components/ads/display-ad.tsx` 的 AdFormat 类型中添加 'outstream'、'multiplex'、'anchor'
  - 在 formatDimensions 中添加尺寸：outstream（250px，16:9）、multiplex（280px）、anchor（50-100px）
  - _需求：1.1、2.1、2.4、3.3、4.5_

- [ ]* 2.2 编写属性测试：格式尺寸验证
  - **属性 1：格式尺寸正确定义**
  - **验证：需求 1.1、2.1、2.4、3.3、4.5**

- [ ]* 2.3 编写属性测试：CLS 预防
  - **属性 4：通过预留空间防止 CLS**
  - **验证：需求 1.2、2.4、3.3、4.5**

- [x] 3. 创建新的预设广告组件
- [x] 3.1 创建 VerticalSidebarAd 组件
  - 使用 DisplayAd 创建组件，format='vertical'，从配置获取 slot
  - 添加 className 属性以提供样式灵活性
  - 从 `src/components/ads/index.ts` 导出
  - _需求：1.1、1.2、1.3_

- [x] 3.2 创建 OutstreamVideoAd 组件
  - 使用 format='outstream' 和流式布局创建组件
  - 使用 `data-ad-format="fluid"` 和 `data-ad-layout-key` 用于视频广告
  - 添加 16:9 宽高比样式
  - 从 `src/components/ads/index.ts` 导出
  - _需求：2.1、2.2、2.3、2.4_

- [x] 3.3 创建 MultiplexAd 组件
  - 使用 format='multiplex' 和 autorelaxed 布局创建组件
  - 使用 `data-ad-format="autorelaxed"` 以获得原生外观
  - 从 `src/components/ads/index.ts` 导出
  - _需求：3.1、3.2、3.3、3.4_

- [ ]* 3.4 编写属性测试：测试模式占位符渲染
  - **属性 3：测试模式渲染占位符**
  - **验证：需求 1.4、2.5**

- [ ]* 3.5 编写属性测试：禁用状态
  - **属性 2：禁用状态不渲染任何内容**
  - **验证：需求 1.5、5.2**

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 5. 创建带关闭功能的 AnchorAd 组件
- [x] 5.1 创建 AnchorAd 组件
  - 创建固定定位在视口底部的组件
  - 添加带有 onClick 处理程序的关闭按钮
  - 使用 sessionStorage 持久化关闭状态
  - 限制最大高度为 100px
  - _需求：4.1、4.2、4.3、4.5_

- [x] 5.2 实现关闭持久性
  - 使用键 'anchor-ad-dismissed' 在 sessionStorage 中存储关闭状态
  - 在组件挂载时检查状态，如果已关闭则返回 null
  - _需求：4.4、4.6_

- [ ]* 5.3 编写属性测试：锚定广告关闭持久性
  - **属性 7：锚定广告关闭持久性**
  - **验证：需求 4.4、4.6**

- [x] 6. 实现广告注入工具
- [x] 6.1 创建 injectAdsIntoContent 函数
  - 在 `src/lib/mdx/inject-ads.tsx` 中创建注入逻辑
  - 实现段落计数和广告插入
  - 支持可配置选项（minParagraphs、firstAdAfter、adInterval、maxAds）
  - _需求：7.1、7.2、7.3、7.4_

- [ ]* 6.2 编写属性测试：广告注入规则
  - **属性 6：广告注入遵守段落数规则**
  - **验证：需求 7.1、7.2、7.3、7.4**

- [x] 7. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 8. 将广告集成到页面
- [x] 8.1 在博客列表页添加 BlogBannerAd
  - 在 `src/app/[locale]/(marketing)/blog/(blog)/page.tsx` 中导入 BlogBannerAd
  - 添加到文章网格上方
  - _需求：6.1_

- [x] 8.2 在博客分页页面添加 BlogBannerAd
  - 在 `src/app/[locale]/(marketing)/blog/(blog)/page/[page]/page.tsx` 中导入 BlogBannerAd
  - 添加到文章网格上方
  - _需求：6.2_

- [x] 8.3 在博客详情页集成广告注入
  - 在博客详情页导入 injectAdsIntoContent
  - 使用注入函数包装 MDX 内容
  - 添加 `InArticleAd` 组件到 MDX 组件以支持手动插入
  - _需求：7.1、7.2、7.3、7.4_

- [x] 8.4 在博客详情页底部添加 MultiplexAd
  - 在文章内容之后、相关文章之前添加 MultiplexAd 组件
  - _需求：3.4_

- [x] 8.5 在博客详情页侧边栏添加 VerticalSidebarAd
  - 用 VerticalSidebarAd 替换或补充 BlogSidebarAd
  - 定位在目录下方
  - _需求：1.1、1.2_

- [ ]* 8.6 编写页面集成的单元测试
  - 测试博客列表页的广告存在性
  - 测试博客分页页面的广告存在性
  - 测试博客详情页的广告注入
  - _需求：6.1、6.2、7.1_

- [x] 9. 在布局中添加 AnchorAd（可选）
- [x] 9.1 在营销布局中添加 AnchorAd
  - 在营销布局中导入 AnchorAd
  - 在布局级别渲染以实现全站覆盖
  - _需求：4.1、4.2_

- [ ]* 9.2 编写 AnchorAd 集成的单元测试
  - 测试锚定广告可见性
  - 测试关闭按钮功能
  - _需求：4.3、4.4_

- [x] 10. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。
  - ✅ 所有 lint 检查通过
  - ✅ 所有 TypeScript 编译通过

---

## 执行进度

**更新时间**：2025-12-03 13:50

### ✅ 全部核心任务已完成

| 任务 | 状态 |
|------|------|
| 1. ADSENSE_CONFIG 扩展 | ✅ |
| 2.1 DisplayAd 新格式 | ✅ |
| 3.1-3.3 新预设组件 | ✅ |
| 4. 检查点 | ✅ |
| 5.1-5.2 AnchorAd | ✅ |
| 6.1 injectAdsIntoContent | ✅ |
| 7. 检查点 | ✅ |
| 8.1-8.5 页面集成 | ✅ |
| 9.1 AnchorAd 布局 | ✅ |
| 10. 最终检查点 | ✅ |

### 可选测试任务 (*)
- 1.1、2.2、2.3、3.4、3.5、5.3、6.2、8.6、9.2 - 未执行

---

## 备注

本任务列表遵循 Kiro Specs 标准：

1. **两级层次结构**：顶级任务和带小数编号的子任务
2. **可选任务标记**：测试任务用 `*` 标记
3. **属性测试位置**：属性测试紧跟相关实现之后
4. **需求引用**：每个任务引用具体需求
5. **检查点**：在主要里程碑后设置战略性检查点
6. **无非编码任务**：所有任务都涉及编写、修改或测试代码
