# Out-stream Video 广告设计方案

**创建日期**: 2025-12-03  
**目标**: 在博客文章中添加 Out-stream 视频广告，提升广告收益 2-4 倍

---

## 一、Out-stream Video 概述

### 什么是 Out-stream

| 特性 | 说明 |
|------|------|
| 定义 | 在非视频内容中插入的视频广告 |
| 触发 | 用户滚动到广告位时自动播放 |
| 声音 | 默认静音，用户可点击开启 |
| 暂停 | 滚动离开时自动暂停 |
| 优势 | 不需要你有视频内容 |

### 收益对比

| 广告类型 | CPM 范围 | 相对收益 |
|----------|----------|----------|
| Horizontal Banner | $0.5-3 | 1x (基准) |
| Rectangle | $1.5-6 | 2-3x |
| **Out-stream Video** | **$2-8** | **3-8x** |
| In-stream Video | $5-20 | 10-20x (需视频内容) |

---

## 二、博客页面广告位规划

### 当前广告位

```
┌─────────────────────────────────────────────┐
│  文章标题                                    │
│  描述文字                                    │
│  [BlogBannerAd - horizontal] ← 已有         │
├─────────────────────────────────────────────┤
│  文章内容...                    │ 侧边栏     │
│                                │ TOC       │
│                                │ [Sidebar] │ ← 已有
│                                │           │
└─────────────────────────────────────────────┘
```

### 新增 Out-stream 广告位

```
┌─────────────────────────────────────────────┐
│  文章标题                                    │
│  描述文字                                    │
│  [BlogBannerAd] ← 保留                      │
├─────────────────────────────────────────────┤
│  第 1-2 段内容...              │ 侧边栏     │
│                                │           │
│  ┌─────────────────────────┐  │           │
│  │ [OutstreamVideoAd] 新增  │  │           │
│  │  视频广告 (300×250)      │  │           │
│  └─────────────────────────┘  │           │
│                                │           │
│  第 3-4 段内容...              │           │
│                                │           │
│  ┌─────────────────────────┐  │           │
│  │ [OutstreamVideoAd] 新增  │  │           │ (长文章可选)
│  └─────────────────────────┘  │           │
│                                │           │
│  剩余内容...                   │           │
└─────────────────────────────────────────────┘
```

### 广告位插入规则

| 规则 | 说明 |
|------|------|
| 最少段落数 | 文章 >= 5 段才插入 |
| 首个广告位置 | 第 2-3 段后 |
| 广告间隔 | 至少间隔 4 段 |
| 最大广告数 | 每篇文章最多 2 个 Out-stream |
| 短文章 | < 5 段不插入 Out-stream |

---

## 三、技术实现方案

### 3.1 新增组件: OutstreamVideoAd

```typescript
// src/components/ads/outstream-video-ad.tsx
'use client';

import { ADSENSE_CONFIG } from '@/lib/config/adsense';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface OutstreamVideoAdProps {
  className?: string;
  lazy?: boolean;
}

export function OutstreamVideoAd({ className, lazy = true }: OutstreamVideoAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [adLoaded, setAdLoaded] = useState(false);

  // 懒加载: 进入视口时加载
  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // 加载广告
  useEffect(() => {
    if (!isVisible || !ADSENSE_CONFIG.enabled || adLoaded) return;
    if (ADSENSE_CONFIG.testMode) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (err) {
      console.error('OutstreamVideoAd load error:', err);
    }
  }, [isVisible, adLoaded]);

  // 禁用时不渲染
  if (!ADSENSE_CONFIG.enabled && !ADSENSE_CONFIG.testMode) {
    return null;
  }

  // 测试模式占位符
  if (ADSENSE_CONFIG.testMode) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'my-6 mx-auto max-w-2xl',
          'bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg',
          'flex items-center justify-center',
          className
        )}
        style={{ minHeight: 250, aspectRatio: '16/9', maxHeight: 400 }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-2xl mb-2">▶</div>
          <p className="text-xs font-medium">Out-stream Video Ad</p>
          <p className="text-[10px] opacity-60">自动播放 · 静音</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('my-6 mx-auto max-w-2xl overflow-hidden rounded-lg', className)}
      style={{ minHeight: 250 }}
    >
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CONFIG.publisherId}
          data-ad-slot={ADSENSE_CONFIG.slots.outstreamVideo}
          data-ad-format="fluid"
          data-ad-layout-key="-6t+ed+2i-1n-4w"  // 视频广告布局
        />
      )}
    </div>
  );
}
```

### 3.2 更新配置

```typescript
// src/lib/config/adsense.ts
export const ADSENSE_CONFIG = {
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  testMode: process.env.NODE_ENV === 'development',

  slots: {
    blogBanner: process.env.NEXT_PUBLIC_ADSENSE_BLOG_BANNER || '',
    blogSidebar: process.env.NEXT_PUBLIC_ADSENSE_BLOG_SIDEBAR || '',
    homeBanner: process.env.NEXT_PUBLIC_ADSENSE_HOME_BANNER || '',
    outstreamVideo: process.env.NEXT_PUBLIC_ADSENSE_OUTSTREAM_VIDEO || '',  // 新增
  },
};
```

### 3.3 更新环境变量

```bash
# env.example 新增
NEXT_PUBLIC_ADSENSE_OUTSTREAM_VIDEO=your-outstream-slot-id
```

### 3.4 导出组件

```typescript
// src/components/ads/index.ts
export {
  DisplayAd,
  BlogBannerAd,
  BlogSidebarAd,
  HomeBannerAd,
} from './display-ad';

export { OutstreamVideoAd } from './outstream-video-ad';  // 新增
```

---

## 四、MDX 内容中插入广告

### 方案 A: 手动插入 (简单)

在 MDX 文件中手动添加广告组件:

```mdx
# 文章标题

第一段内容...

第二段内容...

<OutstreamVideoAd />

第三段内容...
```

**优点**: 完全控制位置  
**缺点**: 每篇文章都要手动添加

### 方案 B: 自动插入 (推荐)

在渲染 MDX 时自动插入广告:

```typescript
// src/lib/mdx/inject-ads.tsx
import { OutstreamVideoAd } from '@/components/ads';
import { Children, isValidElement, cloneElement } from 'react';

interface InjectAdsOptions {
  minParagraphs: number;      // 最少段落数才插入
  firstAdAfter: number;       // 第一个广告在第 N 段后
  adInterval: number;         // 广告间隔段落数
  maxAds: number;             // 最大广告数
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
  
  // 统计段落数
  const paragraphs = childArray.filter(
    (child) => isValidElement(child) && child.type === 'p'
  );

  // 段落太少，不插入广告
  if (paragraphs.length < opts.minParagraphs) {
    return children;
  }

  const result: React.ReactNode[] = [];
  let paragraphCount = 0;
  let adCount = 0;
  let lastAdAt = -opts.adInterval; // 确保首个广告可以插入

  childArray.forEach((child, index) => {
    result.push(child);

    // 检查是否是段落
    if (isValidElement(child) && child.type === 'p') {
      paragraphCount++;

      // 判断是否插入广告
      const shouldInsertAd =
        adCount < opts.maxAds &&
        paragraphCount >= opts.firstAdAfter &&
        paragraphCount - lastAdAt >= opts.adInterval;

      if (shouldInsertAd) {
        result.push(<OutstreamVideoAd key={`ad-${adCount}`} />);
        adCount++;
        lastAdAt = paragraphCount;
      }
    }
  });

  return result;
}
```

### 方案 B 使用方式

```typescript
// 在博客详情页的 MDX 渲染处
import { injectAdsIntoContent } from '@/lib/mdx/inject-ads';

// 渲染时
<article className="prose">
  {injectAdsIntoContent(mdxContent)}
</article>
```

---

## 五、Google AdSense 配置步骤

### 5.1 创建视频广告单元

1. 登录 [AdSense](https://www.google.com/adsense/)
2. 广告 → 按广告单元 → 新建广告单元
3. 选择 **信息流内嵌广告** 或 **文章内嵌广告**
4. 启用 **视频广告** 选项
5. 获取广告单元 ID

### 5.2 广告单元设置建议

| 设置项 | 推荐值 |
|--------|--------|
| 广告类型 | 文章内嵌广告 (In-article) |
| 视频广告 | 启用 |
| 广告尺寸 | 自适应 |
| 布局 | fluid |

### 5.3 代码参数说明

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="fluid"
     data-ad-layout-key="-6t+ed+2i-1n-4w">  <!-- 视频布局 key -->
</ins>
```

`data-ad-layout-key` 是 Google 提供的布局标识，用于视频广告优化展示。

---

## 六、用户体验优化

### 6.1 视觉融合

```css
/* 广告容器样式，与文章内容融合 */
.outstream-video-ad {
  margin: 1.5rem auto;
  border-radius: 8px;
  overflow: hidden;
  background: var(--muted);
}
```

### 6.2 加载状态

```typescript
// 显示骨架屏直到广告加载
{!adLoaded && <Skeleton className="w-full aspect-video" />}
```

### 6.3 CLS 防护

```typescript
// 预留高度，防止布局偏移
style={{ minHeight: 250, aspectRatio: '16/9' }}
```

### 6.4 移动端适配

```typescript
// 移动端使用更小的广告
const isMobile = useMediaQuery('(max-width: 768px)');
style={{ minHeight: isMobile ? 200 : 250 }}
```

---

## 七、实现优先级

### P0 - 核心实现

| 任务 | 预估时间 |
|------|----------|
| 创建 `OutstreamVideoAd` 组件 | 0.5h |
| 更新 `adsense.ts` 配置 | 0.1h |
| 更新 `env.example` | 0.1h |
| 导出组件 | 0.1h |

### P1 - 自动插入

| 任务 | 预估时间 |
|------|----------|
| 实现 `injectAdsIntoContent` | 1h |
| 集成到博客详情页 | 0.5h |
| 测试不同长度文章 | 0.5h |

### P2 - 优化

| 任务 | 预估时间 |
|------|----------|
| 移动端适配 | 0.5h |
| 加载状态优化 | 0.3h |
| A/B 测试不同位置 | 持续 |

---

## 八、预期收益

### 假设数据

- 博客日 PV: 5,000
- 平均文章长度: 8 段
- 每篇插入 1 个 Out-stream

### 收益预估

| 指标 | 当前 (仅 Banner) | 新增 Out-stream 后 |
|------|------------------|-------------------|
| 广告展示 | 5,000 | 10,000 |
| 平均 CPM | $1.5 | $3.5 (混合) |
| 日收益 | $7.5 | $35 |
| 月收益 | $225 | **$1,050** |
| 提升 | - | **+366%** |

---

## 九、注意事项

1. **AdSense 政策**: 每屏最多 3 个广告，避免过度投放
2. **用户体验**: 广告不应打断阅读流，位置要自然
3. **移动端**: 视频广告在移动端可能消耗流量，考虑 WiFi 检测
4. **测试**: 先在少量文章测试，观察用户反馈和收益数据

---

**文档更新时间**: 2025-12-03 13:13
