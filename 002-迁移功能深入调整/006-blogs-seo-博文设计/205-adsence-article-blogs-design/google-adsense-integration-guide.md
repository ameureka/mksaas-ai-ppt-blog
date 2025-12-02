# Google AdSense 完整集成指南

## 目录
1. [申请前准备](#申请前准备)
2. [AdSense 账号申请流程](#adsense-账号申请流程)
3. [网站审核要求](#网站审核要求)
4. [技术集成方案](#技术集成方案)
5. [广告单元配置](#广告单元配置)
6. [性能优化](#性能优化)
7. [常见问题](#常见问题)

---

## 1. 申请前准备

### 1.1 网站基本要求

**必须满足的条件**:
- ✅ 网站已上线并可公开访问
- ✅ 拥有独立域名（不能是子域名或免费域名）
- ✅ 网站内容原创且有价值
- ✅ 网站至少运营 6 个月（建议）
- ✅ 日均访问量 > 100 UV（建议）
- ✅ 网站内容符合 Google 政策

**推荐准备**:
- 至少 30-50 篇高质量内容
- 完善的隐私政策页面
- 关于我们页面
- 联系方式页面
- 网站地图 (sitemap.xml)
- SSL 证书 (HTTPS)

### 1.2 内容质量要求

**必须避免的内容**:
- ❌ 成人内容
- ❌ 暴力、仇恨言论
- ❌ 版权侵权内容
- ❌ 虚假信息
- ❌ 危险或非法内容
- ❌ 过度广告（广告占比 > 30%）

**推荐的内容特征**:
- ✅ 原创性高
- ✅ 对用户有实际价值
- ✅ 定期更新
- ✅ 良好的用户体验
- ✅ 清晰的导航结构

### 1.3 必备页面

创建以下页面（如果还没有）:

**隐私政策页面** (`/privacy-policy`):
```markdown
# 隐私政策

## 信息收集
我们使用 Google AdSense 在网站上展示广告。Google 使用 Cookie 
来根据用户之前对本网站或其他网站的访问记录，向用户展示相关广告。

## Cookie 使用
Google 使用 Cookie 使其能够根据用户对本网站和其他网站的访问记录
向用户展示广告。用户可以通过访问广告设置停用个性化广告。

## 第三方供应商
第三方供应商（包括 Google）使用 Cookie 根据用户之前对本网站
或其他网站的访问记录展示广告。

## 用户权利
用户可以通过访问 www.aboutads.info 停用第三方供应商使用 Cookie 
投放个性化广告。

更新日期：2025-01-26
```

**关于我们页面** (`/about`):
- 网站介绍
- 团队信息
- 联系方式
- 运营时间

---

## 2. AdSense 账号申请流程

### 2.1 注册 AdSense 账号

**步骤 1: 访问 AdSense 官网**
```
https://www.google.com/adsense/start/
```

**步骤 2: 点击"开始使用"**
- 使用 Google 账号登录
- 如果没有 Google 账号，需要先注册

**步骤 3: 填写网站信息**
```
网站 URL: https://ppt-ai.com
内容语言: 中文（简体）
```

**步骤 4: 填写账户信息**
```
国家/地区: 中国
时区: (GMT+08:00) 北京时间
账户类型: 个人 / 企业
```

**步骤 5: 填写收款信息**
```
收款人姓名: [真实姓名]
地址: [详细地址]
邮政编码: [邮编]
电话号码: [手机号]
```

**步骤 6: 接受条款**
- 阅读并接受 AdSense 条款和条件
- 勾选"我已阅读并同意"

### 2.2 添加 AdSense 代码

**步骤 1: 获取 AdSense 代码**

登录 AdSense 后台，会看到类似这样的代码:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**步骤 2: 将代码添加到网站**

在 `src/app/[locale]/layout.tsx` 的 `<head>` 部分添加:


```typescript
// src/app/[locale]/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

**步骤 3: 验证代码安装**

- 部署网站到生产环境
- 等待 24-48 小时
- Google 会自动检测代码是否正确安装

### 2.3 等待审核

**审核时间**: 通常 1-2 周，最长可能 4 周

**审核期间要做的事**:
- ✅ 保持网站正常运行
- ✅ 继续更新高质量内容
- ✅ 确保网站访问速度正常
- ✅ 不要修改网站结构
- ✅ 不要删除 AdSense 代码

**审核状态查看**:
```
登录 AdSense → 首页 → 查看"网站状态"
```

可能的状态:
- 🟡 **审核中**: 等待 Google 审核
- 🟢 **已批准**: 可以开始展示广告
- 🔴 **被拒绝**: 需要根据原因修改后重新申请

---

## 3. 网站审核要求

### 3.1 内容质量检查清单

**基础要求**:
- [ ] 网站有足够的原创内容（至少 30 篇文章）
- [ ] 内容对用户有实际价值
- [ ] 没有抄袭或重复内容
- [ ] 文章长度适中（建议 > 500 字）
- [ ] 图片清晰且相关

**用户体验**:
- [ ] 网站加载速度快（< 3 秒）
- [ ] 移动端适配良好
- [ ] 导航清晰易用
- [ ] 没有过多弹窗
- [ ] 没有误导性内容

**技术要求**:
- [ ] 使用 HTTPS
- [ ] 没有 404 错误
- [ ] 网站地图正常
- [ ] robots.txt 配置正确
- [ ] 没有恶意代码

### 3.2 常见拒绝原因及解决方案

#### 原因 1: 内容不足
**问题**: 网站内容太少或质量不高

**解决方案**:
- 增加至少 30-50 篇高质量文章
- 每篇文章 > 500 字
- 确保内容原创且有价值
- 定期更新内容

#### 原因 2: 网站导航不清晰
**问题**: 用户难以找到内容

**解决方案**:
- 添加清晰的导航菜单
- 创建网站地图页面
- 添加面包屑导航
- 优化内部链接结构

#### 原因 3: 缺少必要页面
**问题**: 缺少隐私政策、关于我们等页面

**解决方案**:
- 创建隐私政策页面
- 创建关于我们页面
- 添加联系方式页面
- 添加服务条款页面

#### 原因 4: 网站未完成
**问题**: 网站看起来像在建设中

**解决方案**:
- 移除"建设中"标识
- 填充所有页面内容
- 确保所有链接可用
- 完善网站设计

#### 原因 5: 流量不足
**问题**: 网站访问量太低

**解决方案**:
- 优化 SEO
- 在社交媒体推广
- 创建更多优质内容
- 等待自然流量增长

### 3.3 针对 PPT 模板网站的特殊建议

**内容策略**:
1. **教程文章**: 如何制作专业 PPT
2. **设计技巧**: PPT 设计最佳实践
3. **案例分析**: 优秀 PPT 案例解析
4. **行业资讯**: PPT 设计趋势
5. **模板使用指南**: 如何使用下载的模板

**示例文章结构**:
```markdown
# 如何制作专业的商务汇报 PPT

## 引言
商务汇报 PPT 是职场必备技能...

## 1. 确定汇报目标
- 明确汇报对象
- 确定核心信息
- 设定预期效果

## 2. 内容结构设计
- 封面页设计
- 目录页规划
- 正文内容组织
- 总结页要点

## 3. 视觉设计原则
- 配色方案选择
- 字体搭配技巧
- 图表使用规范
- 动画效果控制

## 4. 常见错误避免
- 内容过多
- 配色混乱
- 动画过度
- 字体不统一

## 5. 推荐模板
[链接到相关模板]

## 总结
制作专业的商务汇报 PPT 需要...
```

---

## 4. 技术集成方案

### 4.1 项目配置

**步骤 1: 创建 AdSense 配置文件**

```typescript
// src/lib/config/adsense.ts
export const ADSENSE_CONFIG = {
  // 替换为你的 AdSense 发布商 ID
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  
  // 广告单元 ID
  adSlots: {
    // 横幅广告
    homeBanner: process.env.NEXT_PUBLIC_ADSENSE_HOME_BANNER || '1234567890',
    categoryBanner: process.env.NEXT_PUBLIC_ADSENSE_CATEGORY_BANNER || '1234567891',
    detailBanner: process.env.NEXT_PUBLIC_ADSENSE_DETAIL_BANNER || '1234567892',
    
    // 侧边栏广告
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR || '1234567893',
    sidebarLarge: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_LARGE || '1234567894',
    
    // 移动端广告
    mobileBanner: process.env.NEXT_PUBLIC_ADSENSE_MOBILE_BANNER || '1234567895',
  },
  
  // 是否启用广告
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  
  // 测试模式（开发环境）
  testMode: process.env.NODE_ENV === 'development',
}
```

**步骤 2: 添加环境变量**

请在 `env.example` 和 `.env.local` 中添加：

```bash
# .env.local
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ENABLED=true

# 广告单元 ID
NEXT_PUBLIC_ADSENSE_HOME_BANNER=1234567890
NEXT_PUBLIC_ADSENSE_CATEGORY_BANNER=1234567891
NEXT_PUBLIC_ADSENSE_DETAIL_BANNER=1234567892
NEXT_PUBLIC_ADSENSE_SIDEBAR=1234567893
NEXT_PUBLIC_ADSENSE_SIDEBAR_LARGE=1234567894
NEXT_PUBLIC_ADSENSE_MOBILE_BANNER=1234567895
```

**步骤 3: 更新 Layout**

```typescript
// src/app/[locale]/layout.tsx
import Script from 'next/script'
import { ADSENSE_CONFIG } from '@/lib/config/adsense'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google AdSense */}
        {ADSENSE_CONFIG.enabled && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
            onError={(e) => {
              console.error('AdSense script failed to load', e)
            }}
          />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### 4.2 更新广告组件

**更新 DisplayAd 组件**:

```typescript
// src/components/ppt/ads/display-ad.tsx
"use client"

import { useRef, useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ADSENSE_CONFIG } from "@/lib/config/adsense"

type AdFormat = "mrec" | "half_page" | "leaderboard" | "mobile_banner"

interface DisplayAdProps {
  slot: string
  format: AdFormat
  className?: string
  lazy?: boolean
  sticky?: boolean
  delay?: number
  onLoad?: () => void
  onError?: (error: Error) => void
  onImpression?: () => void
}

const formatSizes: Record<AdFormat, { width: number | string; height: number }> = {
  mrec: { width: 300, height: 250 },
  half_page: { width: 300, height: 600 },
  leaderboard: { width: 728, height: 90 },
  mobile_banner: { width: 320, height: 50 },
}

export function DisplayAd({
  slot,
  format,
  className,
  lazy = true,
  sticky = false,
  delay = 0,
  onLoad,
  onError,
  onImpression,
}: DisplayAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(!lazy)
  const [hasError, setHasError] = useState(false)
  const [adLoaded, setAdLoaded] = useState(false)

  const { width, height } = formatSizes[format]

  // 懒加载
  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setIsVisible(true), delay)
            } else {
              setIsVisible(true)
            }
            observer.disconnect()
          }
        })
      },
      { rootMargin: "200px" }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy, delay])

  // 加载 AdSense 广告
  useEffect(() => {
    if (!isVisible || !ADSENSE_CONFIG.enabled || adLoaded) return

    // 测试模式：显示占位符
    if (ADSENSE_CONFIG.testMode) {
      setIsLoading(false)
      return
    }

    try {
      // 等待 AdSense 脚本加载
      const checkAdSense = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkAdSense)
          
          try {
            // 推送广告
            ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            
            setAdLoaded(true)
            setIsLoading(false)
            onLoad?.()
            onImpression?.()
          } catch (err) {
            console.error('AdSense push error:', err)
            setHasError(true)
            setIsLoading(false)
            onError?.(err as Error)
          }
        }
      }, 100)

      // 10秒超时
      setTimeout(() => {
        clearInterval(checkAdSense)
        if (!adLoaded) {
          setHasError(true)
          setIsLoading(false)
          onError?.(new Error('AdSense timeout'))
        }
      }, 10000)

      return () => clearInterval(checkAdSense)
    } catch (err) {
      console.error('AdSense error:', err)
      setHasError(true)
      setIsLoading(false)
      onError?.(err as Error)
    }
  }, [isVisible, adLoaded, onLoad, onError, onImpression])

  // 如果广告未启用，不渲染
  if (!ADSENSE_CONFIG.enabled) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-muted/30 rounded-lg overflow-hidden flex flex-col items-center justify-center",
        sticky && "sticky top-4",
        format === "leaderboard" ? "w-full max-w-[728px]" : "",
        format === "mobile_banner" ? "w-full max-w-[320px]" : "",
        className
      )}
      style={{
        width: format === "leaderboard" || format === "mobile_banner" ? "100%" : width,
        maxWidth: typeof width === "number" ? width : undefined,
        height,
      }}
    >
      {/* 加载状态 */}
      {isLoading && <Skeleton className="absolute inset-0 size-full" />}

      {/* AdSense 广告 */}
      {isVisible && !hasError && (
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          data-ad-client={ADSENSE_CONFIG.publisherId}
          data-ad-slot={slot}
          data-ad-format={format === 'leaderboard' ? 'horizontal' : 'rectangle'}
          data-full-width-responsive="true"
        />
      )}

      {/* 测试模式占位符 */}
      {ADSENSE_CONFIG.testMode && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 w-full h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">广告位 (测试模式)</p>
            <p className="text-xs opacity-70">{format}</p>
            <p className="text-[10px] opacity-50 mt-1">
              {typeof width === "number" ? width : "full"}x{height}
            </p>
            <p className="text-[10px] opacity-50">Slot: {slot}</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <p className="text-xs text-muted-foreground">广告加载失败</p>
        </div>
      )}

      {/* 广告标识 */}
      <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/60 px-1 py-0.5 bg-background/50 rounded pointer-events-none select-none">
        广告
      </div>
    </div>
  )
}

// 声明 window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

// 便捷组件保持不变
export function BannerAd({ className, ...props }: Omit<DisplayAdProps, "format" | "slot">) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.adSlots.homeBanner}
      format="leaderboard"
      className={cn("mx-auto hidden md:flex", className)}
      {...props}
    />
  )
}

export function MobileBannerAd({ className, sticky = true, ...props }: Omit<DisplayAdProps, "format" | "slot">) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.adSlots.mobileBanner}
      format="mobile_banner"
      sticky={sticky}
      className={cn("mx-auto md:hidden", className)}
      {...props}
    />
  )
}

export function SidebarAd({ className, ...props }: Omit<DisplayAdProps, "format" | "slot">) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.adSlots.sidebar}
      format="mrec"
      className={className}
      {...props}
    />
  )
}

export function SidebarLargeAd({ className, sticky = true, ...props }: Omit<DisplayAdProps, "format" | "slot">) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.adSlots.sidebarLarge}
      format="half_page"
      sticky={sticky}
      className={className}
      {...props}
    />
  )
}
```

### 4.3 使用示例

**首页**:
```typescript
// src/app/[locale]/(marketing)/page.tsx
import { BannerAd, MobileBannerAd } from '@/components/ppt/ads/display-ad'

export default function HomePage() {
  return (
    <div>
      {/* PC 横幅广告 */}
      <BannerAd />
      
      {/* 移动端横幅广告 */}
      <MobileBannerAd />
      
      {/* 其他内容 */}
    </div>
  )
}
```

**分类页**:
```typescript
// src/app/[locale]/(marketing)/ppt/category/[slug]/page.tsx
import { BannerAd } from '@/components/ppt/ads/display-ad'

export default function CategoryPage() {
  return (
    <div>
      <BannerAd />
      {/* 内容 */}
    </div>
  )
}
```

---

## 5. 广告单元配置

### 5.1 创建广告单元

**步骤 1: 登录 AdSense 后台**
```
https://www.google.com/adsense/
```

**步骤 2: 创建广告单元**
```
广告 → 按网站 → 新建广告单元
```

**步骤 3: 选择广告类型**

#### 展示广告单元
```
类型: 展示广告
名称: 首页横幅广告
尺寸: 自适应
```

#### 信息流广告单元
```
类型: 信息流广告
名称: 分类页原生广告
样式: 自定义
```

#### 文章内嵌广告
```
类型: 文章内嵌广告
名称: 详情页内容广告
```

### 5.2 推荐的广告单元配置

**首页**:
| 位置 | 类型 | 尺寸 | 优先级 |
|------|------|------|--------|
| Hero 下方 | 横幅 | 728x90 | 高 |
| 侧边栏顶部 | 矩形 | 300x250 | 中 |
| 页面底部 | 横幅 | 728x90 | 低 |

**分类页**:
| 位置 | 类型 | 尺寸 | 优先级 |
|------|------|------|--------|
| 分类信息下 | 横幅 | 728x90 | 高 |
| 列表中间 | 原生 | 自适应 | 高 |
| 页面底部 | 横幅 | 728x90 | 中 |

**详情页**:
| 位置 | 类型 | 尺寸 | 优先级 |
|------|------|------|--------|
| 内容上方 | 横幅 | 728x90 | 高 |
| 侧边栏 | 矩形 | 300x600 | 高 |
| 相关推荐中 | 原生 | 自适应 | 中 |
| 页面底部 | 横幅 | 728x90 | 低 |

### 5.3 广告密度建议

**最佳实践**:
- 每个页面不超过 3-4 个广告单元
- 广告与内容比例 < 30%
- 首屏最多 1 个广告
- 避免广告堆叠

**移动端特殊考虑**:
- 使用锚定广告（底部固定）
- 减少广告数量
- 确保不影响用户体验

---

## 6. 性能优化

### 6.1 延迟加载策略

```typescript
// 首屏广告：立即加载
<BannerAd lazy={false} />

// 非首屏广告：懒加载
<BannerAd lazy={true} delay={500} />

// 底部广告：懒加载 + 延迟
<BannerAd lazy={true} delay={1000} />
```

### 6.2 Next.js Script 优化

```typescript
// app/layout.tsx
<Script
  src="..."
  strategy="afterInteractive"  // 页面交互后加载
  // strategy="lazyOnload"     // 空闲时加载（更激进）
/>
```

### 6.3 性能监控

```typescript
// lib/analytics/adsense.ts
export function trackAdPerformance(adSlot: string, loadTime: number) {
  // 发送到分析服务
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_load', {
      ad_slot: adSlot,
      load_time: loadTime,
    })
  }
}
```

### 6.4 Core Web Vitals 优化

**LCP (Largest Contentful Paint)**:
- 广告不应该是 LCP 元素
- 使用 `loading="lazy"` 属性
- 优先加载内容，延迟加载广告

**CLS (Cumulative Layout Shift)**:
- 为广告预留固定空间
- 使用骨架屏占位
- 避免广告导致布局偏移

```typescript
// 预留广告空间，避免 CLS
<div style={{ minHeight: '90px' }}>
  <BannerAd />
</div>
```

---

## 7. 常见问题

### 7.1 广告不显示

**可能原因**:
1. AdSense 代码未正确安装
2. 广告单元 ID 错误
3. 网站未通过审核
4. 广告被浏览器拦截
5. 地区限制

**解决方案**:
```typescript
// 添加调试日志
useEffect(() => {
  console.log('AdSense Config:', ADSENSE_CONFIG)
  console.log('AdSense Script Loaded:', !!window.adsbygoogle)
}, [])
```

### 7.2 广告收入低

**优化建议**:
1. 提高网站流量
2. 优化广告位置
3. 使用自动广告
4. 启用个性化广告
5. 优化内容质量

### 7.3 账号被封禁

**常见原因**:
- 无效点击
- 内容违规
- 流量作弊
- 违反政策

**预防措施**:
- 不要点击自己的广告
- 不要鼓励用户点击
- 确保流量真实
- 遵守所有政策

### 7.4 ads.txt 文件

**什么是 ads.txt**:
- 防止广告欺诈的文件
- 声明授权的广告供应商

**创建 ads.txt**:

```typescript
// public/ads.txt
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

**Next.js 配置**:
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/ads.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
    ]
  },
}
```

---

## 8. 测试和验证

### 8.1 本地测试

**开发环境配置**:
```bash
# .env.local
NEXT_PUBLIC_ADSENSE_ENABLED=false  # 开发时关闭
NODE_ENV=development
```

**测试模式**:
```typescript
// 显示占位符而不是真实广告
if (ADSENSE_CONFIG.testMode) {
  return <AdPlaceholder />
}
```

### 8.2 生产环境验证

**步骤 1: 部署到生产环境**
```bash
npm run build
npm run start
```

**步骤 2: 使用 Google Publisher Toolbar**
- 安装 Chrome 扩展
- 访问你的网站
- 查看广告加载状态

**步骤 3: 检查 AdSense 后台**
```
广告 → 按网站 → 查看展示次数
```

### 8.3 性能测试

**使用 Lighthouse**:
```bash
npm install -g lighthouse
lighthouse https://your-site.com --view
```

**检查指标**:
- Performance Score > 90
- CLS < 0.1
- LCP < 2.5s

---

## 9. 最佳实践总结

### 9.1 申请阶段
- ✅ 确保网站内容充足且原创
- ✅ 完善必要页面（隐私政策、关于我们）
- ✅ 优化网站性能和用户体验
- ✅ 等待足够的流量积累

### 9.2 集成阶段
- ✅ 使用环境变量管理配置
- ✅ 实现懒加载和延迟加载
- ✅ 为广告预留空间避免 CLS
- ✅ 添加错误处理和降级方案

### 9.3 优化阶段
- ✅ 监控广告性能
- ✅ A/B 测试不同位置
- ✅ 优化广告密度
- ✅ 持续改进内容质量

### 9.4 维护阶段
- ✅ 定期检查 AdSense 后台
- ✅ 遵守 Google 政策
- ✅ 及时处理违规通知
- ✅ 优化广告收益

---

## 10. 参考资源

**官方文档**:
- [AdSense 帮助中心](https://support.google.com/adsense)
- [AdSense 政策中心](https://support.google.com/adsense/answer/48182)
- [AdSense 优化指南](https://support.google.com/adsense/topic/1319753)

**工具**:
- [Google Publisher Toolbar](https://chrome.google.com/webstore/detail/google-publisher-toolbar)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Search Console](https://search.google.com/search-console)

**社区**:
- [AdSense 社区论坛](https://support.google.com/adsense/community)
- [WebmasterWorld AdSense Forum](https://www.webmasterworld.com/google_adsense/)

---

**文档版本**: v1.0
**最后更新**: 2025-01-26
**维护者**: AI Team
