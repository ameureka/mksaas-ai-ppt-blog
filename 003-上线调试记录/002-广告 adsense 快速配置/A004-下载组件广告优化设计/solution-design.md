# 下载组件广告优化设计 - 解决方案

**设计日期**: 2025-12-04
**版本**: 1.0

---

## 一、解决方案概述

### 1.1 目标

将下载组件的"观看广告下载"功能从 Mock 实现升级为可用的生产级功能，实现：
1. 广告观看 → 积分奖励 → 下载解锁
2. 后端验证防止绕过
3. 防刷机制保护

### 1.2 方案选择

**推荐方案: 积分奖励模式 (无真实广告)**

由于 Web 端激励视频广告 SDK 选择有限且集成复杂，建议采用"模拟广告 + 积分奖励"模式：
- 保持当前 30s 倒计时 UI
- 用户观看完成后获得积分奖励
- 积分可用于下载 PPT

**优势**:
- 开发成本低
- 用户体验一致
- 可随时升级为真实广告

---

## 二、技术方案

### 2.1 系统架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        优化后的下载流程                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  用户点击下载                                                                │
│        │                                                                     │
│        ↓                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 1: 选择下载方式                                                │    │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │    │
│  │  │ 🎁 首次免费下载  │ │ 💎 积分下载     │ │ 📺 观看广告下载  │        │    │
│  │  │ (检查下载历史)  │ │ (检查积分余额)  │ │ (30秒等待)      │        │    │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│        │                                                                     │
│        ↓ 选择 "观看广告下载"                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 2: 广告观看                                                    │    │
│  │                                                                      │    │
│  │  1. 前端请求 POST /api/ad/start-watch                                │    │
│  │     └─ 后端生成 watchToken + 记录开始时间                            │    │
│  │                                                                      │    │
│  │  2. 前端显示 30s 倒计时 + 广告内容                                   │    │
│  │                                                                      │    │
│  │  3. 倒计时结束，请求 POST /api/ad/complete-watch                     │    │
│  │     └─ 后端验证:                                                     │    │
│  │        - watchToken 有效性                                           │    │
│  │        - 时间间隔 >= 30s                                             │    │
│  │        - 用户今日观看次数 < 限制                                     │    │
│  │     └─ 验证通过: 发放积分 + 返回 downloadToken                       │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│        │                                                                     │
│        ↓ 广告完成                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 3: 下载                                                        │    │
│  │                                                                      │    │
│  │  请求 POST /api/ppts/{id}/download                                   │    │
│  │  └─ body: { method: 'ad', downloadToken }                            │    │
│  │                                                                      │    │
│  │  后端验证 downloadToken → 返回 fileUrl                               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据库设计

#### 新增表: ad_watch_record (广告观看记录)

```sql
CREATE TABLE ad_watch_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user(id),
  ip_address VARCHAR(45),
  watch_token VARCHAR(64) UNIQUE NOT NULL,
  download_token VARCHAR(64),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, expired
  credits_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ad_watch_user_id ON ad_watch_record(user_id);
CREATE INDEX idx_ad_watch_ip ON ad_watch_record(ip_address);
CREATE INDEX idx_ad_watch_token ON ad_watch_record(watch_token);
CREATE INDEX idx_ad_watch_created ON ad_watch_record(created_at);
```

#### 新增表: user_download_history (用户下载历史)

```sql
CREATE TABLE user_download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user(id),
  ppt_id VARCHAR(64) NOT NULL,
  download_method VARCHAR(20) NOT NULL, -- firstFree, credits, ad
  credits_spent INTEGER DEFAULT 0,
  ip_address VARCHAR(45),
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_download_user_ppt ON user_download_history(user_id, ppt_id);
CREATE INDEX idx_download_user ON user_download_history(user_id);
```

### 2.3 API 设计

#### POST /api/ad/start-watch

**请求**:
```typescript
{
  pptId: string;  // 要下载的 PPT ID
}
```

**响应**:
```typescript
{
  success: boolean;
  data?: {
    watchToken: string;    // 观看令牌
    duration: number;      // 需要观看的秒数 (30)
    expiresAt: string;     // 令牌过期时间
  };
  error?: string;
}
```

**逻辑**:
1. 检查用户今日观看次数 (IP + userId)
2. 生成 watchToken (JWT 或随机字符串)
3. 记录到 ad_watch_record 表
4. 返回 watchToken

#### POST /api/ad/complete-watch

**请求**:
```typescript
{
  watchToken: string;
  pptId: string;
}
```

**响应**:
```typescript
{
  success: boolean;
  data?: {
    downloadToken: string;  // 下载令牌
    creditsAwarded: number; // 获得的积分
    newBalance: number;     // 新积分余额
  };
  error?: string;
}
```

**逻辑**:
1. 验证 watchToken 有效性
2. 检查时间间隔 >= 30s
3. 检查是否已完成
4. 发放积分 (如果启用)
5. 生成 downloadToken
6. 更新 ad_watch_record 状态

#### POST /api/ppts/{id}/download (修改)

**请求**:
```typescript
{
  method: 'firstFree' | 'credits' | 'ad';
  downloadToken?: string;  // ad 方式必需
}
```

**响应**:
```typescript
{
  success: boolean;
  data?: {
    fileUrl: string;
    expiresAt: string;
  };
  error?: string;
}
```

**逻辑**:
```typescript
switch (method) {
  case 'firstFree':
    // 检查是否首次下载此 PPT
    // 检查用户下载历史
    break;
  case 'credits':
    // 检查积分余额
    // 扣除积分
    break;
  case 'ad':
    // 验证 downloadToken
    // 检查 token 是否已使用
    break;
}
// 记录下载历史
// 返回 fileUrl
```

### 2.4 前端修改

#### download-modal.tsx 修改

```typescript
// 新增状态
const [watchToken, setWatchToken] = useState<string | null>(null);
const [downloadToken, setDownloadToken] = useState<string | null>(null);

// 开始观看广告
const handleStartAdWatch = async () => {
  try {
    const res = await fetch('/api/ad/start-watch', {
      method: 'POST',
      body: JSON.stringify({ pptId: ppt.id }),
    });
    const json = await res.json();
    if (json.success) {
      setWatchToken(json.data.watchToken);
      setStep(2);
      // 开始倒计时
    } else {
      toast.error(json.error);
    }
  } catch (err) {
    toast.error('启动广告失败');
  }
};

// 广告观看完成
const handleAdComplete = async () => {
  try {
    const res = await fetch('/api/ad/complete-watch', {
      method: 'POST',
      body: JSON.stringify({ watchToken, pptId: ppt.id }),
    });
    const json = await res.json();
    if (json.success) {
      setDownloadToken(json.data.downloadToken);
      setAdCompleted(true);
      toast.success(`获得 ${json.data.creditsAwarded} 积分！`);
    } else {
      toast.error(json.error);
    }
  } catch (err) {
    toast.error('验证广告失败');
  }
};

// 生成下载链接
const handleGenerateLink = async () => {
  const body: any = { method: selectedMethod };
  if (selectedMethod === 'ad') {
    body.downloadToken = downloadToken;
  }

  const res = await fetch(`/api/ppts/${ppt.id}/download`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  // ...
};
```

### 2.5 积分系统修改

#### 添加广告奖励类型

```typescript
// src/credits/types.ts
export enum CREDIT_TRANSACTION_TYPE {
  // ... 现有类型
  AD_REWARD = 'AD_REWARD',  // 新增: 广告奖励
}
```

#### 添加获得积分 Action

```typescript
// src/actions/earn-credits.ts
export async function earnCreditsAction({
  amount,
  type,
  description,
}: {
  amount: number;
  type: CREDIT_TRANSACTION_TYPE;
  description: string;
}) {
  // 1. 获取当前用户
  // 2. 增加积分余额
  // 3. 记录交易
  // 4. 返回新余额
}
```

### 2.6 配置修改

```typescript
// src/config/website.tsx
websiteConfig.credits.enableCredits = true;  // 启用积分系统

// 新增广告配置
websiteConfig.adReward = {
  enable: true,
  creditsPerWatch: 5,        // 每次观看获得积分
  watchDuration: 30,         // 观看时长 (秒)
  dailyLimitPerUser: 10,     // 每用户每日限制
  dailyLimitPerIP: 20,       // 每 IP 每日限制
};
```

---

## 三、防刷机制

### 3.1 多层防护

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        防刷机制                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: 前端防护                                                           │
│  ├── 倒计时不可跳过                                                          │
│  ├── 页面切换检测 (visibilitychange)                                         │
│  └── 禁用开发者工具修改 (基础)                                               │
│                                                                              │
│  Layer 2: Token 验证                                                         │
│  ├── watchToken 一次性使用                                                   │
│  ├── downloadToken 一次性使用                                                │
│  └── Token 过期时间 (5分钟)                                                  │
│                                                                              │
│  Layer 3: 时间验证                                                           │
│  ├── 服务端记录开始时间                                                      │
│  ├── 完成时验证时间间隔 >= 30s                                               │
│  └── 允许 ±5s 误差                                                           │
│                                                                              │
│  Layer 4: 频率限制                                                           │
│  ├── 每用户每日限制 (10次)                                                   │
│  ├── 每 IP 每日限制 (20次)                                                   │
│  └── 全局每小时限制 (可选)                                                   │
│                                                                              │
│  Layer 5: 异常检测 (可选)                                                    │
│  ├── 异常快速完成检测                                                        │
│  ├── 批量请求检测                                                            │
│  └── 设备指纹检测                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 实现代码

```typescript
// src/lib/ad-watch-limiter.ts

const DAILY_LIMIT_PER_USER = 10;
const DAILY_LIMIT_PER_IP = 20;
const MIN_WATCH_DURATION = 25; // 允许 5s 误差

export async function checkAdWatchLimit(userId?: string, ip?: string) {
  const today = new Date().toISOString().split('T')[0];

  // 检查用户限制
  if (userId) {
    const userCount = await db.query(
      `SELECT COUNT(*) FROM ad_watch_record
       WHERE user_id = $1 AND DATE(created_at) = $2 AND status = 'completed'`,
      [userId, today]
    );
    if (userCount >= DAILY_LIMIT_PER_USER) {
      return { allowed: false, reason: '今日观看次数已达上限' };
    }
  }

  // 检查 IP 限制
  if (ip) {
    const ipCount = await db.query(
      `SELECT COUNT(*) FROM ad_watch_record
       WHERE ip_address = $1 AND DATE(created_at) = $2 AND status = 'completed'`,
      [ip, today]
    );
    if (ipCount >= DAILY_LIMIT_PER_IP) {
      return { allowed: false, reason: '当前网络观看次数已达上限' };
    }
  }

  return { allowed: true };
}

export function validateWatchDuration(startedAt: Date, completedAt: Date) {
  const duration = (completedAt.getTime() - startedAt.getTime()) / 1000;
  return duration >= MIN_WATCH_DURATION;
}
```

---

## 四、文件变更清单

### 4.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/app/api/ad/start-watch/route.ts` | 开始观看广告 API |
| `src/app/api/ad/complete-watch/route.ts` | 完成观看广告 API |
| `src/db/schema/ad-watch.ts` | 广告观看记录表 schema |
| `src/db/schema/download-history.ts` | 下载历史表 schema |
| `src/actions/ad/start-watch.ts` | 开始观看 action |
| `src/actions/ad/complete-watch.ts` | 完成观看 action |
| `src/actions/earn-credits.ts` | 获得积分 action |
| `src/lib/ad-watch-limiter.ts` | 防刷限制器 |

### 4.2 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/config/website.tsx` | 添加广告奖励配置 |
| `src/credits/types.ts` | 添加 AD_REWARD 类型 |
| `src/app/api/ppts/[id]/download/route.ts` | 添加 method 参数处理 |
| `src/components/ppt/download/download-modal.tsx` | 集成广告 API |
| `src/hooks/use-credits.ts` | 添加 useEarnCredits hook |

### 4.3 数据库迁移

```bash
# 生成迁移
pnpm db:generate

# 执行迁移
pnpm db:migrate
```

---

## 五、实施计划

### Phase 1: 基础设施 (Day 1)

1. 创建数据库表
2. 实现广告观看 API
3. 实现防刷限制器

### Phase 2: 积分集成 (Day 1-2)

1. 启用积分系统
2. 添加广告奖励类型
3. 实现积分发放逻辑

### Phase 3: 前端集成 (Day 2)

1. 修改 download-modal.tsx
2. 集成广告 API
3. 添加积分显示

### Phase 4: 测试验证 (Day 3)

1. 功能测试
2. 防刷测试
3. 边界情况测试

---

## 六、风险与回滚

### 6.1 风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 积分系统 bug | 中 | 高 | 充分测试，灰度发布 |
| 防刷被绕过 | 低 | 中 | 多层防护，监控异常 |
| 用户体验下降 | 低 | 中 | A/B 测试，收集反馈 |

### 6.2 回滚方案

```bash
# 1. 禁用广告奖励
websiteConfig.adReward.enable = false

# 2. 回滚代码
git revert <commit-hash>

# 3. 回滚数据库 (如需)
pnpm db:rollback
```

---

**设计完成时间**: 2025-12-04
**预估工作量**: 3-4 天
**优先级**: 🟡 中
