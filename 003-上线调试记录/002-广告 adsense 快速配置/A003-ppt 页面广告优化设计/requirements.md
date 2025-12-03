# PPT 页面广告集成需求文档

**创建日期**: 2025-12-04
**更新日期**: 2025-12-04
**优先级**: 🔴 高
**预估工作量**: 4-5 小时

---

## 一、背景分析

### 1.1 当前状态

博客系列页面已完成广告集成 (6 个广告位)，PPT 系列页面需要集成两种广告类型：

| 页面 | 横幅广告 (Banner) | 原生广告 (Native) | 状态 |
|------|-------------------|-------------------|------|
| PPT 首页 `/ppt` | ❌ 无 | ❌ 无 | 需新增 |
| PPT 详情页 `/ppt/[id]` | ⚠️ 有占位符 | ❌ 无 | 需替换+新增 |
| PPT 分类页 `/ppt/category/[name]` | ❌ 无 | ❌ 无 | 需新增 |
| PPT 分类总览 `/ppt/categories` | ❌ 无 | ❌ 无 | 需新增 |

### 1.2 广告类型说明

#### 横幅广告 (Banner Ad)
- 组件: `BlogBannerAd`, `MultiplexAd`
- 特点: 标准 AdSense 广告，显眼位置
- 适用: 页面顶部/中部/底部

#### 原生广告 (Native Ad)
- 组件: `NativeAdCard`
- 特点: 与 PPTCard 样式一致，融入内容流
- 适用: PPT 网格列表中，混入内容卡片
- 功能: 展示追踪 (50% 可见触发)、点击追踪

### 1.3 之前犯过的错误 (经验教训)

1. **DisplayAd slot 检查顺序问题**
   - 问题: 空 slot 时在测试模式下也返回 null
   - 修复: 调整检查顺序，测试模式下允许空 slot 显示占位符

2. **AnchorAd SSR/CSR hydration 不匹配**
   - 问题: 服务端和客户端渲染结果不一致
   - 修复: 添加 mounted 状态处理

3. **暗色主题下样式不可见**
   - 问题: 占位符在暗色主题下看不见
   - 修复: 使用 `bg-card` 和 `border-border` 适配主题

---

## 二、需求规格

### 需求 1: PPT 详情页广告集成

**User Story**: 作为网站运营者，我希望在 PPT 详情页添加多种广告，以最大化广告收益。

**验收标准**:
1. WHEN 用户访问 PPT 详情页 THEN 系统 SHALL 在评价区域上方显示 BlogBannerAd (替换占位符)
2. WHEN 用户访问 PPT 详情页 THEN 系统 SHALL 在推荐模板下方显示 MultiplexAd
3. WHEN 用户浏览推荐模板 THEN 系统 SHALL 在推荐模板网格第 4 位显示 NativeAdCard
4. WHEN 广告组件加载时 THEN 系统 SHALL 显示 Skeleton 占位符防止 CLS
5. WHEN 开发模式下 THEN 系统 SHALL 显示广告占位符而非真实广告

### 需求 2: PPT 首页广告集成

**User Story**: 作为网站运营者，我希望在 PPT 首页添加广告，以增加广告收益。

**验收标准**:
1. WHEN 用户访问 PPT 首页 THEN 系统 SHALL 在热门分类下方显示 BlogBannerAd
2. WHEN 用户浏览精选模板 THEN 系统 SHALL 在精选模板网格第 5 位显示 NativeAdCard
3. WHEN 用户搜索后 THEN 系统 SHALL 在搜索结果上方显示 BlogBannerAd
4. WHEN 用户查看搜索结果 THEN 系统 SHALL 在搜索结果网格第 5、11 位显示 NativeAdCard
5. WHEN 广告组件加载时 THEN 系统 SHALL 使用懒加载避免影响首屏性能

### 需求 3: PPT 分类页广告集成

**User Story**: 作为网站运营者，我希望在 PPT 分类页添加广告，以增加广告收益。

**验收标准**:
1. WHEN 用户访问 PPT 分类页 THEN 系统 SHALL 在 Hero 区域下方显示 BlogBannerAd
2. WHEN 用户浏览精选 PPT THEN 系统 SHALL 在精选 PPT 网格第 6 位显示 NativeAdCard
3. WHEN 用户浏览全部 PPT THEN 系统 SHALL 在全部 PPT 网格第 6 位显示 NativeAdCard

### 需求 4: PPT 分类总览页广告集成

**User Story**: 作为网站运营者，我希望在 PPT 分类总览页添加广告，以增加广告收益。

**验收标准**:
1. WHEN 用户访问分类总览页 THEN 系统 SHALL 在分类网格下方显示 BlogBannerAd
2. WHEN 用户浏览精选模板 THEN 系统 SHALL 在精选模板网格第 6 位显示 NativeAdCard

### 需求 5: 原生广告追踪

**User Story**: 作为网站运营者，我希望追踪原生广告的展示和点击，以分析广告效果。

**验收标准**:
1. WHEN 原生广告 50% 可见时 THEN 系统 SHALL 触发展示追踪回调
2. WHEN 用户点击原生广告 THEN 系统 SHALL 触发点击追踪回调
3. WHEN 原生广告展示时 THEN 系统 SHALL 显示 "广告" 标识

---

## 三、技术约束

1. **复用现有广告组件** (`src/components/ads/`)
   - BlogBannerAd, MultiplexAd (横幅广告)
   - NativeAdCard (原生广告) - 需从 v0 代码迁移
2. **不引入新的依赖**
3. **保持与博客页面一致的广告体验**
4. **确保 SSR/CSR 兼容性**
5. **支持暗色主题**
6. **保持页面性能** (懒加载、CLS 防护)

---

## 四、广告类型对比

| 广告类型 | 位置 | 特点 | 收益潜力 | 用户体验 |
|----------|------|------|----------|----------|
| 横幅广告 (BlogBannerAd) | 页面顶部/中部 | 显眼，标准格式 | 中等 | 中等影响 |
| 原生广告 (NativeAdCard) | 内容流中 | 融入内容，不突兀 | 高 | 影响小 |
| 多元广告 (MultiplexAd) | 页面底部 | 推荐样式 | 中等 | 影响小 |

**策略**: 横幅广告 + 原生广告组合，最大化收益同时保持用户体验

---

## 五、广告位汇总

| 编号 | 页面 | 广告类型 | 位置 | 优先级 |
|------|------|----------|------|--------|
| #1 | PPT 首页 | BlogBannerAd | 热门分类下方 | 高 |
| #2 | PPT 首页 | NativeAdCard | 精选模板第 5 位 | 高 |
| #3 | PPT 首页 | BlogBannerAd | 搜索结果上方 | 中 |
| #4 | PPT 首页 | NativeAdCard | 搜索结果第 5、11 位 | 中 |
| #5 | PPT 详情页 | BlogBannerAd | 评价区域上方 | 高 |
| #6 | PPT 详情页 | NativeAdCard | 推荐模板第 4 位 | 高 |
| #7 | PPT 详情页 | MultiplexAd | 推荐模板下方 | 中 |
| #8 | PPT 分类页 | BlogBannerAd | Hero 下方 | 高 |
| #9 | PPT 分类页 | NativeAdCard | 精选 PPT 第 6 位 | 高 |
| #10 | PPT 分类页 | NativeAdCard | 全部 PPT 第 6 位 | 中 |
| #11 | 分类总览 | BlogBannerAd | 分类网格下方 | 中 |
| #12 | 分类总览 | NativeAdCard | 精选模板第 6 位 | 中 |

**总计**: 12 个广告位 (5 个横幅 + 6 个原生 + 1 个多元)
