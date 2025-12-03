# Rewarded Video 补全方案

**创建日期**: 2025-12-03  
**当前状态**: 前端框架 90% 完成，后端 API 和积分对接待实现

---

## 一、现有实现分析

### ✅ 已完成

| 模块 | 文件 | 功能 |
|------|------|------|
| Hook 核心 | `src/hooks/ads/use-rewarded-video.ts` | 状态机、视频绑定、时间追踪 |
| 防作弊 | `AntiCheatDetector` 类 | 焦点检测、禁止快进、强制1倍速、时间校验 |
| 下载选项 UI | `src/components/ppt/download/download-options-modal.tsx` | 多方式选择 |
| 下载流程 UI | `src/components/ppt/download/download-modal.tsx` | 3步流程 + 倒计时 |

### ❌ 待完成

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 后端验证 API | P0 | 开始观看、完成验证、防重放 |
| 积分发放 | P0 | 对接 credit_transaction 表 |
| 视频广告源 | P1 | AdSense Video 或自有广告 |
| 下载链接签名 | P1 | 安全的临时下载 URL |

---

## 二、后端 API 设计

### 2.1 开始观看 API

**路径**: `POST /api/ads/rewarded/start`

```typescript
// 请求
interface StartWatchingRequest {
  pptId: string;
  adType: 'video_30s' | 'video_15s';
}

// 响应
interface StartWatchingResponse {
  success: boolean;
  data: {
    viewId: string;        // 唯一观看会话 ID
    token: string;         // 防伪 token (JWT)
    videoUrl: string;      // 广告视频 URL
    duration: number;      // 视频时长 (秒)
    minWatchTime: number;  // 最少观看时间 (秒)
    expiresAt: string;     // token 过期时间
  };
}
```

**后端逻辑**:
```
1. 验证用户身份 (可选，支持匿名)
2. 检查 pptId 是否有效
3. 生成 viewId (UUID)
4. 生成 JWT token (包含 viewId, pptId, startTime, expiresAt)
5. 记录到 ad_view_session 表
6. 返回视频信息
```

### 2.2 完成验证 API

**路径**: `POST /api/ads/rewarded/complete`

```typescript
// 请求
interface CompleteWatchingRequest {
  viewId: string;
  token: string;
  watchTime: number;       // 客户端报告的观看时长
  clientTimestamp: number; // 客户端时间戳
}

// 响应
interface CompleteWatchingResponse {
  success: boolean;
  data: {
    verified: boolean;
    creditsAwarded: number;
    downloadToken: string;  // 用于下载的一次性 token
    downloadUrl: string;    // 签名下载 URL
    expiresAt: string;      // 下载链接过期时间
  };
  error?: string;
}
```

**后端验证逻辑**:
```
1. 验证 JWT token 有效性
2. 检查 viewId 是否存在且未使用
3. 校验时间:
   - realTimePassed = now - session.startTime
   - 允许误差 < 5秒
   - watchTime >= minWatchTime
4. 标记 session 为已完成 (防重放)
5. 发放积分到 credit_transaction
6. 生成签名下载 URL
7. 返回结果
```

### 2.3 数据库表设计

```sql
-- 广告观看会话表
CREATE TABLE ad_view_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id VARCHAR(64) UNIQUE NOT NULL,
  user_id UUID REFERENCES "user"(id),  -- 可为空 (匿名用户)
  ppt_id VARCHAR(64) NOT NULL,
  ad_type VARCHAR(32) NOT NULL,        -- 'video_30s', 'video_15s'
  
  -- 时间追踪
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- 状态
  status VARCHAR(32) NOT NULL DEFAULT 'started',  -- started, completed, expired, failed
  watch_time_reported INTEGER,         -- 客户端报告的观看时长
  
  -- 防作弊
  client_ip VARCHAR(64),
  user_agent TEXT,
  
  -- 奖励
  credits_awarded INTEGER DEFAULT 0,
  download_token VARCHAR(128),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ad_view_session_user ON ad_view_session(user_id);
CREATE INDEX idx_ad_view_session_ppt ON ad_view_session(ppt_id);
CREATE INDEX idx_ad_view_session_status ON ad_view_session(status);
CREATE INDEX idx_ad_view_session_expires ON ad_view_session(expires_at);
```

---

## 三、积分发放对接

### 3.1 与现有 Credits 系统集成

你已有 `user_credit` 和 `credit_transaction` 表，发放逻辑：

```typescript
// src/credits/actions/award-ad-credits.ts
import { db } from '@/db';
import { creditTransaction, userCredit } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function awardAdCredits(params: {
  userId: string;
  viewId: string;
  pptId: string;
  credits: number;
}) {
  const { userId, viewId, pptId, credits } = params;

  return await db.transaction(async (tx) => {
    // 1. 检查是否已发放 (防重复)
    const existing = await tx.query.creditTransaction.findFirst({
      where: eq(creditTransaction.referenceId, viewId),
    });
    if (existing) {
      throw new Error('Credits already awarded for this view');
    }

    // 2. 记录交易
    await tx.insert(creditTransaction).values({
      userId,
      amount: credits,
      type: 'ad_reward',
      description: `观看广告奖励 (PPT: ${pptId})`,
      referenceId: viewId,
    });

    // 3. 更新用户余额
    await tx
      .update(userCredit)
      .set({
        balance: sql`${userCredit.balance} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    return { success: true, credits };
  });
}
```

### 3.2 交易类型扩展

在 `credit_transaction` 表的 `type` 字段添加：

```typescript
type CreditTransactionType = 
  | 'purchase'      // 购买
  | 'gift'          // 赠送
  | 'ad_reward'     // 广告奖励 (新增)
  | 'download'      // 下载消耗
  | 'refund';       // 退款
```

---

## 四、视频广告源方案

### 方案 A: Google AdSense Video (推荐)

**优点**: 高 CPM，自动填充广告  
**缺点**: 需要 AdSense 审核通过

```typescript
// 配置
NEXT_PUBLIC_ADSENSE_VIDEO_SLOT=1234567890

// 使用 Google IMA SDK
<script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
```

### 方案 B: 自有广告视频

**优点**: 完全控制，无需审核  
**缺点**: 需要自己找广告主

```typescript
// 配置自有广告视频列表
const AD_VIDEOS = [
  { id: 'ad1', url: '/ads/video1.mp4', duration: 30 },
  { id: 'ad2', url: '/ads/video2.mp4', duration: 15 },
];
```

### 方案 C: 第三方广告平台

- **AdMob** (Google 移动端)
- **Unity Ads**
- **ironSource**
- **AppLovin**

---

## 五、安全下载链接

### 5.1 签名 URL 生成

```typescript
// src/lib/download/signed-url.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET);

export async function generateSignedDownloadUrl(params: {
  pptId: string;
  userId?: string;
  viewId: string;
  expiresIn?: number; // 秒，默认 48 小时
}): Promise<string> {
  const { pptId, userId, viewId, expiresIn = 48 * 60 * 60 } = params;

  const token = await new SignJWT({
    pptId,
    userId,
    viewId,
    type: 'download',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(SECRET);

  return `${process.env.NEXT_PUBLIC_BASE_URL}/api/download/ppt/${pptId}?token=${token}`;
}

export async function verifyDownloadToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}
```

### 5.2 下载 API

```typescript
// app/api/download/ppt/[id]/route.ts
import { verifyDownloadToken } from '@/lib/download/signed-url';
import { getStorageProvider } from '@/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 401 });
  }

  const { valid, payload } = await verifyDownloadToken(token);
  if (!valid || payload?.pptId !== params.id) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

  // 获取文件并返回
  const storage = getStorageProvider();
  const fileUrl = await storage.getSignedUrl(`ppts/${params.id}/file.pptx`);
  
  return Response.redirect(fileUrl);
}
```

---

## 六、前端 Hook 补全

### 6.1 更新 use-rewarded-video.ts

```typescript
// 替换 load 函数中的 Mock 代码
const load = useCallback(async () => {
  setStatus('loading');
  setError(null);

  try {
    const response = await fetch('/api/ads/rewarded/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pptId, adType: 'video_30s' }),
    });

    if (!response.ok) {
      throw new Error('Failed to start ad session');
    }

    const { data } = await response.json();
    viewIdRef.current = data.viewId;
    tokenRef.current = data.token;
    videoUrlRef.current = data.videoUrl;  // 新增

    startTimeRef.current = Date.now();
    setStatus('ready');
  } catch (err) {
    setError(err as Error);
    setStatus('error');
  }
}, [pptId]);

// 替换 complete 函数中的 Mock 代码
const complete = useCallback(async () => {
  setStatus('verifying');

  try {
    // 防作弊验证
    if (antiCheatRef.current) {
      const isValid = antiCheatRef.current.validate(currentTime, startTimeRef.current);
      if (!isValid) {
        throw new Error('验证失败：检测到异常观看行为');
      }
    }

    const response = await fetch('/api/ads/rewarded/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        viewId: viewIdRef.current,
        token: tokenRef.current,
        watchTime: currentTime,
        clientTimestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const { data } = await response.json();
    setDownloadLink(data.downloadUrl);
    setStatus('completed');
  } catch (err) {
    setError(err as Error);
    setStatus('error');
  }
}, [currentTime]);
```

---

## 七、实现优先级

### P0 - 必须完成 (核心功能)

| 任务 | 预估时间 | 依赖 |
|------|----------|------|
| 创建 `ad_view_session` 表 | 0.5h | - |
| 实现 `/api/ads/rewarded/start` | 1h | 表 |
| 实现 `/api/ads/rewarded/complete` | 1.5h | 表 |
| 积分发放 `awardAdCredits` | 1h | credit 表 |
| 更新前端 Hook | 0.5h | API |

### P1 - 重要 (安全 & 体验)

| 任务 | 预估时间 | 依赖 |
|------|----------|------|
| 签名下载 URL | 1h | - |
| 下载 API 验证 | 0.5h | 签名 |
| 防重放检查 | 0.5h | API |

### P2 - 可选 (优化)

| 任务 | 预估时间 | 依赖 |
|------|----------|------|
| 接入 AdSense Video | 2h | AdSense 审核 |
| 匿名用户支持 | 1h | - |
| 观看统计面板 | 2h | 表 |

---

## 八、测试清单

- [ ] 正常观看完整视频 → 获得积分 + 下载链接
- [ ] 中途关闭页面 → 不发放积分
- [ ] 快进视频 → 被阻止，进度重置
- [ ] 倍速播放 → 被强制 1 倍速
- [ ] 重复提交同一 viewId → 拒绝
- [ ] 过期 token → 拒绝
- [ ] 下载链接 48h 后 → 失效

---

**文档更新时间**: 2025-12-03 12:29
