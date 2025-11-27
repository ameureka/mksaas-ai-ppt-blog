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
components/ads/
├── display-ad.tsx          # 展示广告（Banner、侧边栏）
├── native-ad-card.tsx      # 原生广告卡片
└── rewarded-video-ad.tsx   # 激励视频广告
```

### 1.2 相关 Hooks
```
hooks/
└── use-rewarded-video.ts   # 激励视频状态管理
```

---

## 2. 广告类型与实现

### 2.1 展示广告 (Display Ads)

**文件**: `components/ads/display-ad.tsx`

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

**文件**: `components/ads/native-ad-card.tsx`

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

**文件**: `components/ads/rewarded-video-ad.tsx`
**Hook**: `hooks/use-rewarded-video.ts`

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

### 3.1 首页 (app/page.tsx)

**位置**: Hero Section 下方
```typescript
<BannerAd />  // 728x90 横幅广告
```

### 3.2 分类页 (app/category/[name]/page.tsx)

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

### 3.3 PPT详情页 (app/ppt/[id]/page.tsx)

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

### 3.4 下载流程 (components/download-flow/download-modal.tsx)

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
[TODO] 发送展示追踪到后端
```

### 4.2 原生广告流程

```
组件渲染
    ↓
Intersection Observer (50% 可见)
    ↓
触发 onImpression(adId)
    ↓
[TODO] 发送展示追踪
    ↓
用户点击
    ↓
触发 onClick(adId)
    ↓
[TODO] 发送点击追踪
    ↓
打开外部链接
```

### 4.3 激励视频广告流程

```
用户选择观看广告
    ↓
调用 load() - 请求广告资源
    ↓
[TODO] POST /api/ads/rewarded/start
    ← 返回 { viewId, token, videoUrl }
    ↓
播放视频 (防作弊监控)
    ↓
达到最小观看时长 (80%)
    ↓
调用 complete() - 验证观看
    ↓
[TODO] POST /api/ads/rewarded/complete
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
- `components/ads/native-ad-card.tsx` - mockNativeAd
- `hooks/use-rewarded-video.ts` - Mock 视频链接和下载链接

### 5.2 需要实现的 API

#### 5.2.1 展示广告 API

```typescript
// 获取广告配置
GET /api/ads/config
Response: {
  slots: {
    home_top: { provider: 'adsense', slotId: 'xxx' },
    sidebar_1: { provider: 'adsense', slotId: 'yyy' }
  }
}

// 追踪广告展示
POST /api/ads/impression
Body: {
  slotId: string
  adId: string
  userId?: string
  timestamp: string
}

// 追踪广告填充率
POST /api/ads/unfilled
Body: {
  slotId: string
  timestamp: string
}
```

#### 5.2.2 原生广告 API

```typescript
// 获取原生广告
GET /api/ads/native?position=category_featured_6
Response: {
  id: string
  imageUrl: string
  headline: string
  description: string
  advertiser: string
  logoUrl: string
  clickUrl: string
  callToAction: string
}

// 追踪展示
POST /api/ads/native/impression
Body: {
  adId: string
  position: string
  userId?: string
}

// 追踪点击
POST /api/ads/native/click
Body: {
  adId: string
  position: string
  userId?: string
}
```

#### 5.2.3 激励视频广告 API

```typescript
// 开始观看
POST /api/ads/rewarded/start
Body: {
  pptId: string
  userId: string
}
Response: {
  viewId: string
  token: string
  videoUrl: string
  duration: number
}

// 完成观看并验证
POST /api/ads/rewarded/complete
Body: {
  viewId: string
  token: string
  watchTime: number
  pptId: string
}
Response: {
  success: boolean
  downloadUrl: string
  credits: number
  expiresAt: string
}

// 记录跳过
POST /api/ads/rewarded/skip
Body: {
  viewId: string
  watchTime: number
}
```

---

## 6. 数据库设计建议

### 6.1 广告配置表 (ad_configs)

```sql
CREATE TABLE ad_configs (
  id VARCHAR(50) PRIMARY KEY,
  slot_id VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,  -- 'adsense', 'custom', etc.
  format VARCHAR(50) NOT NULL,    -- 'banner', 'native', 'video'
  enabled BOOLEAN DEFAULT true,
  config JSON,                    -- 额外配置
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6.2 广告展示记录表 (ad_impressions)

```sql
CREATE TABLE ad_impressions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ad_id VARCHAR(100) NOT NULL,
  slot_id VARCHAR(100),
  position VARCHAR(100),
  user_id VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ad_id (ad_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

### 6.3 广告点击记录表 (ad_clicks)

```sql
CREATE TABLE ad_clicks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ad_id VARCHAR(100) NOT NULL,
  slot_id VARCHAR(100),
  position VARCHAR(100),
  user_id VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ad_id (ad_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

### 6.4 激励视频观看记录表 (rewarded_video_views)

```sql
CREATE TABLE rewarded_video_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  view_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  ppt_id VARCHAR(50) NOT NULL,
  video_url TEXT,
  duration INT NOT NULL,           -- 视频总时长(秒)
  watch_time INT DEFAULT 0,        -- 实际观看时长(秒)
  status VARCHAR(20) NOT NULL,     -- 'started', 'completed', 'skipped', 'failed'
  token VARCHAR(255),              -- 验证token
  download_url TEXT,               -- 生成的下载链接
  credits_awarded INT DEFAULT 0,   -- 奖励的积分
  completed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,       -- 下载链接过期时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_ppt_id (ppt_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 6.5 原生广告内容表 (native_ads)

```sql
CREATE TABLE native_ads (
  id VARCHAR(50) PRIMARY KEY,
  headline VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  logo_url TEXT,
  advertiser VARCHAR(100) NOT NULL,
  click_url TEXT NOT NULL,
  call_to_action VARCHAR(50),
  positions JSON,                  -- 允许展示的位置
  priority INT DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 7. 集成方案

### 7.1 Google AdSense 集成

**步骤1**: 修改 `components/ads/display-ad.tsx`

```typescript
// 替换 TODO 部分
{isVisible && !isLoading && !hasError && (
  <ins 
    className="adsbygoogle"
    style={{ display: 'block' }}
    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
    data-ad-slot={slot}
    data-ad-format="auto"
    data-full-width-responsive="true"
  />
)}

// 在 useEffect 中初始化
useEffect(() => {
  if (isVisible && window.adsbygoogle) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
      setHasError(true);
    }
  }
}, [isVisible]);
```

**步骤2**: 在 `app/layout.tsx` 中添加 AdSense 脚本

```typescript
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

### 7.2 后端 API 实现建议

**技术栈**: Next.js App Router + Server Actions

**文件结构**:
```
app/api/ads/
├── config/route.ts
├── impression/route.ts
├── native/
│   ├── route.ts
│   ├── impression/route.ts
│   └── click/route.ts
└── rewarded/
    ├── start/route.ts
    ├── complete/route.ts
    └── skip/route.ts
```

**示例实现** (`app/api/ads/rewarded/start/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { pptId, userId } = await request.json();
    
    // 生成唯一 viewId 和 token
    const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = generateToken();
    
    // 获取视频URL (从广告平台或CDN)
    const videoUrl = await getRewardedVideoUrl();
    
    // 记录到数据库
    await db.rewardedVideoViews.create({
      data: {
        viewId,
        userId,
        pptId,
        videoUrl,
        duration: 30,
        status: 'started',
        token,
      }
    });
    
    return NextResponse.json({
      viewId,
      token,
      videoUrl,
      duration: 30
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start video' },
      { status: 500 }
    );
  }
}
```

### 7.3 前端集成步骤

**步骤1**: 创建广告配置 Hook

```typescript
// hooks/use-ad-config.ts
export function useAdConfig() {
  const [slots, setSlots] = useState({});
  
  useEffect(() => {
    fetch('/api/ads/config')
      .then(res => res.json())
      .then(data => setSlots(data.slots));
  }, []);
  
  return { slots };
}
```

**步骤2**: 创建广告追踪 Hook

```typescript
// hooks/use-ad-tracking.ts
export function useAdTracking() {
  const trackImpression = useCallback(async (adId: string, position: string) => {
    await fetch('/api/ads/impression', {
      method: 'POST',
      body: JSON.stringify({ adId, position })
    });
  }, []);
  
  const trackClick = useCallback(async (adId: string, position: string) => {
    await fetch('/api/ads/click', {
      method: 'POST',
      body: JSON.stringify({ adId, position })
    });
  }, []);
  
  return { trackImpression, trackClick };
}
```

**步骤3**: 更新激励视频 Hook

```typescript
// hooks/use-rewarded-video.ts
const load = useCallback(async () => {
  setStatus('loading');
  
  try {
    // 替换 Mock 为真实 API
    const response = await fetch('/api/ads/rewarded/start', {
      method: 'POST',
      body: JSON.stringify({ pptId, userId: user?.id })
    });
    
    const { viewId, token, videoUrl } = await response.json();
    
    viewIdRef.current = viewId;
    tokenRef.current = token;
    
    setStatus('ready');
  } catch (err) {
    setError(err as Error);
    setStatus('error');
  }
}, [pptId, user]);
```

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
