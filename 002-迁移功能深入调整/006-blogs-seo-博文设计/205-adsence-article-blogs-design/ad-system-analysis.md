# 广告系统完整分析报告

## 目录
1. [广告组件概览](#广告组件概览)
2. [广告类型与实现](#广告类型与实现)
3. [广告展示位置](#广告展示位置)
4. [数据流与架构](#数据流与架构)
5. [API与Server Actions](#api与server-actions)
6. [数据库设计建议](#数据库设计建议)
7. [集成方案](#集成方案)

---

## 1. 广告组件概览

### 1.1 组件文件结构
```
src/components/ppt/ads/
├── display-ad.tsx          # 展示广告（Banner、侧边栏）
├── native-ad-card.tsx      # 原生广告卡片
└── rewarded-video-ad.tsx   # 激励视频广告
```

### 1.2 相关 Hooks
```
src/hooks/ads/
└── use-rewarded-video.ts   # 激励视频状态管理
```

---

## 2. 广告类型与实现

### 2.1 展示广告 (Display Ads)

**文件**: `src/components/ppt/ads/display-ad.tsx`

**广告格式**:
- `mrec`: 300x250 (中矩形)
- `half_page`: 300x600 (半页广告)
- `leaderboard`: 728x90 (横幅广告)
- `mobile_banner`: 320x50 (移动横幅)

**核心功能**:

- **懒加载**: 使用 Intersection Observer，提前 200px 开始加载
- **延迟加载**: 支持自定义延迟时间
- **粘性定位**: 支持 sticky 定位
- **回调事件**: onLoad, onError, onImpression

**便捷组件**:
```typescript
<BannerAd slot="home_top" />              // 横幅广告 (PC)
<MobileBannerAd slot="home_mobile" />     // 移动横幅
<SidebarAd slot="sidebar_1" />            // 侧边栏广告
<SidebarLargeAd slot="sidebar_large" />   // 侧边栏大广告
```

**TODO 集成点**:
- Google AdSense 集成
- 广告位配置管理
- 广告填充率追踪

---

### 2.2 原生广告 (Native Ads)

**文件**: `src/components/ppt/ads/native-ad-card.tsx`

**数据结构**:
```typescript
interface NativeAdData {
  id: string              // 广告ID
  imageUrl: string        // 广告图片
  headline: string        // 标题
  description: string     // 描述
  advertiser: string      // 广告主
  logoUrl?: string        // Logo
  clickUrl: string        // 点击链接
  callToAction: string    // 行动号召
}
```

**核心功能**:
- **展示追踪**: 50% 可见时触发 impression
- **点击追踪**: 记录点击事件
- **外部跳转**: 新窗口打开，noopener/noreferrer

**使用示例**:
```typescript
<NativeAdCard 
  ad={mockNativeAd}
  position="category_featured_6"
  onImpression={(adId) => console.log('展示', adId)}
  onClick={(adId) => console.log('点击', adId)}
/>
```

---

### 2.3 激励视频广告 (Rewarded Video Ads)

**文件**: `src/components/ppt/ads/rewarded-video-ad.tsx`
**Hook**: `src/hooks/ads/use-rewarded-video.ts`

**状态流转**:
```
idle → loading → ready → playing → verifying → completed
                              ↓
                           paused
                              ↓
                          skipped
```

**核心功能**:


1. **防作弊机制** (AntiCheatDetector):
   - 页面焦点检测（失焦暂停）
   - 阻止快进（最多允许1秒误差）
   - 强制1倍速播放
   - 时间偏差验证（允许3秒偏差）
   - 焦点丢失时间限制（最多10秒）

2. **观看验证**:
   - 最小观看比例: 80% (可配置)
   - 跳过允许时间: 15秒后 (可配置)
   - 视频时长: 30秒 (可配置)

3. **奖励机制**:
   - 完成观看 → 获得下载链接
   - 获得积分奖励 (1积分)
   - 48小时有效下载链接

**使用示例**:
```typescript
<RewardedVideoAd
  open={isOpen}
  onOpenChange={setIsOpen}
  pptId="ppt_123"
  pptTitle="商务PPT模板"
  onComplete={({ downloadUrl, credits }) => {
    // 处理完成逻辑
  }}
  onSkip={() => {
    // 处理跳过逻辑
  }}
/>
```

---

## 3. 广告展示位置

### 3.1 首页 (src/app/[locale]/(marketing)/page.tsx)

**位置**: Hero Section 下方
```typescript
<BannerAd />  // 728x90 横幅广告
```

### 3.2 分类页 (src/app/[locale]/(marketing)/ppt/category/[slug]/page.tsx)

**位置1**: 分类信息下方
```typescript
<BannerAd />
```

**位置2**: 精选PPT区块中
```typescript
// 第7个位置插入原生广告
<NativeAdCard 
  ad={mockNativeAd}
  position="category_featured_6"
/>
```

**位置3**: 全部PPT区块上方
```typescript
<BannerAd />
```

**位置4**: 页面底部
```typescript
<BannerAd />
```

### 3.3 PPT详情页 (src/app/[locale]/(marketing)/ppt/[id]/page.tsx)

**位置1**: 模板详情下方
```html
<div className="广告位 728x90">
  Google AdSense
</div>
```

**位置2**: 相关推荐区块中
```html
<Card className="原生广告位 280x210">
  原生广告
</Card>
```

**位置3**: 页面底部
```html
<div className="广告位 728x90">
  Google AdSense
</div>
```

### 3.4 下载流程 (src/components/ppt/download/download-modal.tsx)

**激励视频广告**:
- 用户选择"观看广告下载"
- 播放30秒视频广告
- 完成后获得5积分 + 下载权限

---

## 4. 数据流与架构

### 4.1 展示广告流程

```
用户访问页面
    ↓
Intersection Observer 检测可见性
    ↓
延迟加载 (可选)
    ↓
加载广告内容
    ↓
触发 onImpression 回调
    ↓
[TODO] Server Action: recordAdImpression
```

### 4.2 原生广告流程

```
组件渲染
    ↓
Intersection Observer (50% 可见)
    ↓
触发 onImpression(adId)
    ↓
[TODO] Server Action: recordAdImpression
    ↓
用户点击
    ↓
触发 onClick(adId)
    ↓
[TODO] Server Action: recordAdClick
    ↓
打开外部链接
```

### 4.3 激励视频广告流程

```
用户选择观看广告
    ↓
调用 load() - 请求广告资源
    ↓
[TODO] Server Action: startRewardedVideo
    ← 返回 { viewId, token, videoUrl }
    ↓
播放视频 (防作弊监控)
    ↓
达到最小观看时长 (80%)
    ↓
调用 complete() - 验证观看
    ↓
[TODO] Server Action: completeRewardedVideo
    发送 { viewId, token, watchTime }
    ← 返回 { downloadUrl, credits }
    ↓
显示下载链接 + 积分奖励
```

---

## 5. API与Server Actions

### 5.1 当前状态

**现状**: 所有广告功能都是 **Mock 实现**，没有真实的后端 API

**Mock 数据位置**:
- `src/components/ppt/ads/native-ad-card.tsx` - mockNativeAd
- `src/hooks/ads/use-rewarded-video.ts` - Mock 视频链接和下载链接

### 5.2 需要实现的 Server Actions

建议使用 Server Actions (`src/actions/ads/`) 处理核心逻辑，而非 API Routes。

#### 5.2.1 展示广告 Action

```typescript
// src/actions/ads/config.ts
export async function getAdConfig() {
  // ... return config
}

// src/actions/ads/tracking.ts
export async function recordAdImpression(data: { slotId: string; adId: string }) {
  // ... db insert
}
```

#### 5.2.2 原生广告 Action

```typescript
// src/actions/ads/native.ts
export async function getNativeAd(position: string) {
  // ... db select
}

export async function recordNativeAdClick(adId: string) {
  // ... db insert
}
```

#### 5.2.3 激励视频广告 Action

```typescript
// src/actions/ads/rewarded.ts

// 开始观看
export async function startRewardedVideo(input: { pptId: string }) {
  // 生成 viewId, token
  // 记录到 DB (status: 'started')
  // 返回 token, videoUrl
}

// 完成观看并验证
export async function completeRewardedVideo(input: { 
  viewId: string; 
  token: string; 
  watchTime: number 
}) {
  // 验证 token 和 watchTime
  // 更新 DB (status: 'completed')
  // 发放奖励 (Credits + Download URL)
}
```

---

## 6. 数据库设计建议 (Drizzle ORM)

### 6.1 广告配置表 (ad_config)

```typescript
// src/db/schema.ts
export const adConfig = pgTable("ad_config", {
  id: text("id").primaryKey(),
  slotId: text("slot_id").notNull(),
  provider: text("provider").notNull(), // 'adsense', 'custom'
  format: text("format").notNull(),     // 'banner', 'native', 'video'
  enabled: boolean("enabled").default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 6.2 广告展示记录表 (ad_impression)

```typescript
export const adImpression = pgTable("ad_impression", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  adId: text("ad_id").notNull(),
  slotId: text("slot_id"),
  position: text("position"),
  userId: text("user_id"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  adIdIdx: index("ad_impression_ad_id_idx").on(table.adId),
  createdAtIdx: index("ad_impression_created_at_idx").on(table.createdAt),
}));
```

### 6.3 激励视频观看记录表 (rewarded_video_view)

```typescript
export const rewardedVideoView = pgTable("rewarded_video_view", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  viewId: text("view_id").unique().notNull(),
  userId: text("user_id").notNull(),
  pptId: text("ppt_id").notNull(),
  videoUrl: text("video_url"),
  duration: integer("duration").notNull(),
  watchTime: integer("watch_time").default(0),
  status: text("status").notNull(), // 'started', 'completed', 'skipped'
  token: text("token"),
  downloadUrl: text("download_url"),
  creditsAwarded: integer("credits_awarded").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("rewarded_view_user_id_idx").on(table.userId),
  statusIdx: index("rewarded_view_status_idx").on(table.status),
}));
```

---

## 7. 集成方案

### 7.1 Google AdSense 集成

**步骤1**: 修改 `src/components/ppt/ads/display-ad.tsx`
(保持原逻辑，确保 script 加载正确)

**步骤2**: 在 `src/app/[locale]/layout.tsx` 或根 `src/app/layout.tsx` 中添加 AdSense 脚本。

```typescript
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

### 7.2 后端 Action 实现示例 (Drizzle)

**示例实现** (`src/actions/ads/rewarded.ts`):

```typescript
'use server'

import { getDb } from '@/db';
import { rewardedVideoView } from '@/db/schema';
import { randomUUID } from 'crypto';

export async function startRewardedVideo(pptId: string, userId: string) {
  const db = await getDb();
  const viewId = `view_${Date.now()}`;
  const token = randomUUID();
  
  await db.insert(rewardedVideoView).values({
    viewId,
    userId,
    pptId,
    duration: 30,
    status: 'started',
    token,
    createdAt: new Date(),
  });
  
  return { viewId, token, videoUrl: '...' };
}
```

### 7.3 前端集成步骤

**步骤1**: 创建广告配置 Hook `src/hooks/ads/use-ad-config.ts`

**步骤2**: 使用 `useAction` (next-safe-action) 调用 Server Actions 追踪展示和点击。

**步骤3**: 更新激励视频 Hook `src/hooks/ads/use-rewarded-video.ts` 调用真实的 Server Action。


---

## 8. 总结

### 8.1 当前状态
- ✅ 前端组件完整实现
- ✅ UI/UX 设计完善
- ✅ 防作弊机制完备
- ❌ 后端 API 未实现 (全部 Mock)
- ❌ 数据库表未创建
- ❌ Google AdSense 未集成

### 8.2 优先级建议

**P0 (必须)**:
1. 实现激励视频广告后端 API
2. 创建数据库表结构
3. 集成 Google AdSense

**P1 (重要)**:
1. 实现原生广告管理系统
2. 添加广告数据统计面板
3. 实现广告追踪和分析

**P2 (优化)**:
1. A/B 测试不同广告位置
2. 优化广告加载性能
3. 添加广告收益报表

### 8.3 技术债务
- 需要将 Mock 数据替换为真实 API
- 需要添加错误处理和重试机制
- 需要添加广告缓存策略
- 需要实现广告反作弊系统的服务端验证

---

**文档版本**: v1.0
**最后更新**: 2025-01-26
**维护者**: AI Team
