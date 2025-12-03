# PPT 页面广告集成任务清单

**创建日期**: 2025-12-04
**更新日期**: 2025-12-04
**预估总工时**: 4-5 小时

---

## 任务列表

### 任务 0: 前置准备 🔴 高优先级

- [x] 0.1 迁移原生广告组件 ✅
  - 复制 `vo-ui-code-pro/v0mksaaspptsite/components/ads/native-ad-card.tsx` 到 `src/components/ads/`
  - 更新 `src/components/ads/index.ts` 添加导出
  - 验证 TypeScript 编译无错误
  - _Requirements: 5.1, 5.2, 5.3_

---

### 任务 1: PPT 详情页广告集成 🔴 高优先级

- [x] 1.1 导入广告组件 ✅
  - 添加 `import { BlogBannerAd, MultiplexAd } from '@/components/ads';`
  - 添加 `import { NativeAdCard, mockNativeAd } from '@/components/ads/native-ad-card';`
  - 文件: `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 替换占位符广告为 BlogBannerAd ✅
  - 找到第 ~660 行的占位符 div
  - 替换为 `<BlogBannerAd className="my-12" />`
  - _Requirements: 1.1, 1.4_

- [x] 1.3 在推荐模板网格第 4 位插入原生广告 ✅
  - 修改推荐模板渲染逻辑
  - 在第 4 位插入 `NativeAdCard`
  - 设置 position="detail_recommended_4"
  - _Requirements: 1.3, 5.1, 5.2_

- [x] 1.4 在推荐模板区域后添加 MultiplexAd ✅
  - 在推荐模板 Card 组件后添加
  - 添加 `<MultiplexAd className="my-8" />`
  - _Requirements: 1.2_

- [ ] 1.5 验证 PPT 详情页广告显示
  - 验证 BlogBannerAd 显示
  - 验证 NativeAdCard 显示在正确位置
  - 验证 MultiplexAd 显示
  - 验证暗色主题适配
  - _Requirements: 1.4, 1.5_

---

### 任务 2: PPT 首页广告集成 🔴 高优先级

- [x] 2.1 导入广告组件 ✅
  - 添加 `import { BlogBannerAd } from '@/components/ads';`
  - 添加 `import { NativeAdCard, mockNativeAd } from '@/components/ads/native-ad-card';`
  - 文件: `src/app/[locale]/(marketing)/ppt/page.tsx`
  - _Requirements: 2.1, 2.2_

- [x] 2.2 在热门分类后添加横幅广告 ✅
  - 在 `{/* Quick Category Navigation */}` section 后添加
  - 添加 `<section className="container mx-auto mb-8 px-4"><BlogBannerAd /></section>`
  - 仅在 `!hasSearched` 时显示
  - _Requirements: 2.1, 2.5_

- [x] 2.3 在精选模板网格第 5 位插入原生广告 ✅
  - 修改 `renderFeaturedGrid` 函数
  - 在第 5 位插入 `NativeAdCard`
  - 设置 position="home_featured_5"
  - _Requirements: 2.2, 5.1, 5.2_

- [x] 2.4 在搜索结果上方添加横幅广告 ✅
  - 修改 `renderSearchResults` 函数
  - 在搜索结果网格前添加 `<BlogBannerAd className="mb-8" />`
  - _Requirements: 2.3_

- [x] 2.5 在搜索结果网格第 5、11 位插入原生广告 ✅
  - 修改搜索结果渲染逻辑
  - 在第 5 位和第 11 位插入 `NativeAdCard`
  - 设置不同的 position 标识
  - _Requirements: 2.4, 5.1, 5.2_

- [ ] 2.6 验证 PPT 首页广告显示
  - 验证未搜索状态下广告显示
  - 验证搜索后广告显示
  - 验证原生广告位置正确
  - _Requirements: 2.5_

---

### 任务 3: PPT 分类页广告集成 🟡 中优先级

- [x] 3.1 导入广告组件 ✅
  - 添加 `import { BlogBannerAd } from '@/components/ads';`
  - 添加 `import { NativeAdCard, mockNativeAd } from '@/components/ads/native-ad-card';`
  - 文件: `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.2 在 Hero 区域后添加横幅广告 ✅
  - 在分类 Hero section 后添加
  - 添加 `<section className="mb-8"><BlogBannerAd /></section>`
  - _Requirements: 3.1_

- [x] 3.3 在精选 PPT 网格第 6 位插入原生广告 ✅
  - 修改精选 PPT 渲染逻辑
  - 在第 6 位插入 `NativeAdCard`
  - 设置 position="category_{name}_featured_6"
  - _Requirements: 3.2, 5.1, 5.2_

- [x] 3.4 在全部 PPT 网格第 6 位插入原生广告 ✅
  - 修改全部 PPT 渲染逻辑
  - 在第 6 位插入 `NativeAdCard`
  - 设置 position="category_{name}_all_6"
  - _Requirements: 3.3, 5.1, 5.2_

- [ ] 3.5 验证 PPT 分类页广告显示
  - 验证横幅广告位置正确
  - 验证原生广告位置正确
  - 验证暗色主题适配
  - _Requirements: 3.1, 3.2, 3.3_

---

### 任务 4: PPT 分类总览页广告集成 🟢 低优先级

- [x] 4.1 导入广告组件 ✅
  - 添加 `import { BlogBannerAd } from '@/components/ads';`
  - 添加 `import { NativeAdCard, mockNativeAd } from '@/components/ads/native-ad-card';`
  - 文件: `src/app/[locale]/(marketing)/ppt/categories/page.tsx`
  - _Requirements: 4.1, 4.2_

- [x] 4.2 在分类网格后添加横幅广告 ✅
  - 在分类网格 section 后添加
  - 添加 `<section className="mb-8"><BlogBannerAd /></section>`
  - _Requirements: 4.1_

- [x] 4.3 在精选模板网格第 6 位插入原生广告 ✅
  - 修改精选模板渲染逻辑
  - 在第 6 位插入 `NativeAdCard`
  - 设置 position="categories_featured_6"
  - _Requirements: 4.2, 5.1, 5.2_

- [ ] 4.4 验证分类总览页广告显示
  - 验证横幅广告位置正确
  - 验证原生广告位置正确
  - _Requirements: 4.1, 4.2_

---

### 任务 5: 最终验证

- [ ] 5.1 全面测试
  - 测试所有 PPT 页面广告显示
  - 测试暗色/亮色主题切换
  - 测试移动端响应式布局
  - _Requirements: 1.5, 2.5, 3.5, 4.4_

- [ ] 5.2 原生广告追踪验证
  - 验证展示追踪 (50% 可见触发)
  - 验证点击追踪
  - 验证控制台输出正确
  - _Requirements: 5.1, 5.2, 5.3_

---

## 代码变更清单

| 文件 | 变更类型 | 变更内容 |
|------|----------|----------|
| `src/components/ads/native-ad-card.tsx` | 新增 | 迁移原生广告组件 |
| `src/components/ads/index.ts` | 修改 | 添加 NativeAdCard 导出 |
| `src/app/[locale]/(marketing)/ppt/[id]/page.tsx` | 修改 | 添加 BlogBannerAd + NativeAdCard + MultiplexAd |
| `src/app/[locale]/(marketing)/ppt/page.tsx` | 修改 | 添加 BlogBannerAd + NativeAdCard |
| `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx` | 修改 | 添加 BlogBannerAd + NativeAdCard |
| `src/app/[locale]/(marketing)/ppt/categories/page.tsx` | 修改 | 添加 BlogBannerAd + NativeAdCard |

---

## 验证检查清单

### PPT 详情页 `/ppt/[id]`
- [ ] BlogBannerAd 在评价区域上方显示
- [ ] NativeAdCard 在推荐模板第 4 位显示
- [ ] MultiplexAd 在推荐模板下方显示
- [ ] 原生广告显示 "广告" 标识
- [ ] 暗色主题下可见
- [ ] 无 CLS 问题

### PPT 首页 `/ppt`
- [ ] BlogBannerAd 在热门分类下方显示
- [ ] NativeAdCard 在精选模板第 5 位显示
- [ ] 搜索后 BlogBannerAd 在结果上方显示
- [ ] 搜索后 NativeAdCard 在第 5、11 位显示
- [ ] 暗色主题下可见

### PPT 分类页 `/ppt/category/[name]`
- [ ] BlogBannerAd 在 Hero 区域下方显示
- [ ] NativeAdCard 在精选 PPT 第 6 位显示
- [ ] NativeAdCard 在全部 PPT 第 6 位显示
- [ ] 暗色主题下可见

### PPT 分类总览 `/ppt/categories`
- [ ] BlogBannerAd 在分类网格下方显示
- [ ] NativeAdCard 在精选模板第 6 位显示
- [ ] 暗色主题下可见

### 原生广告追踪
- [ ] 50% 可见时触发展示追踪
- [ ] 点击时触发点击追踪
- [ ] 控制台输出正确的 adId 和 position

---

## 广告位汇总

| 编号 | 页面 | 广告类型 | 位置 | 状态 |
|------|------|----------|------|------|
| #1 | PPT 首页 | BlogBannerAd | 热门分类下方 | ✅ |
| #2 | PPT 首页 | NativeAdCard | 精选模板第 5 位 | ✅ |
| #3 | PPT 首页 | BlogBannerAd | 搜索结果上方 | ✅ |
| #4a | PPT 首页 | NativeAdCard | 搜索结果第 5 位 | ✅ |
| #4b | PPT 首页 | NativeAdCard | 搜索结果第 11 位 | ✅ |
| #5 | PPT 详情页 | BlogBannerAd | 评价区域上方 | ✅ |
| #6 | PPT 详情页 | NativeAdCard | 推荐模板第 4 位 | ✅ |
| #7 | PPT 详情页 | MultiplexAd | 推荐模板下方 | ✅ |
| #8 | PPT 分类页 | BlogBannerAd | Hero 下方 | ✅ |
| #9 | PPT 分类页 | NativeAdCard | 热门 PPT 第 6 位 | ✅ |
| #10 | PPT 分类页 | NativeAdCard | 精选 PPT 第 6 位 | ✅ |
| #11 | PPT 分类页 | NativeAdCard | 全部 PPT 第 6 位 | ✅ |
| #12 | 分类总览 | BlogBannerAd | 页面顶部 | ✅ |
| #13 | 分类总览 | NativeAdCard | 分类网格第 5 位 | ✅ |
| #14 | 分类总览 | BlogBannerAd | 页面底部 | ✅ |

**总计**: 15 个广告位 (6 个横幅 + 8 个原生 + 1 个多元) ✅ 已全部实现
