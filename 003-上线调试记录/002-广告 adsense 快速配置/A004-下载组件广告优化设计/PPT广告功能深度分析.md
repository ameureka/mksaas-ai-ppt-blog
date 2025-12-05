# PPT 广告功能深度分析报告

## 用户报告的问题

用户在测试时发现：**"观看广告下载"点击没有反应**

---

## 任务1: PPT 广告位验证分析

### 检查结果 ✅

#### 代码集成状态

**NativeAdCard 组件**:
- ✅ 组件文件存在: `src/components/ads/native-ad-card.tsx`
- ✅ 完整的交互功能：
  - Intersection Observer 实现（50%可见触发）
  - onImpression 回调支持
  - onClick 回调支持
  - Mock 数据已提供

**PPT 页面集成**:
已在以下页面集成 NativeAdCard:

1. ✅ `/ppt` (主页) - `src/app/[locale]/(marketing)/ppt/page.tsx`
   - 3处使用 (第532, 681, 720行)

2. ✅ `/ppt/[id]` (详情页) - `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`
   - 2处使用 (第771, 874行)

3. ✅ `/ppt/categories` (分类列表) - `src/app/[locale]/(marketing)/ppt/categories/page.tsx`
   - 1处使用 (第219行)

4. ✅ `/ppt/category/[name]` (分类详情) - `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`
   - 3处使用 (第504, 573, 656行)

#### 预期行为

访问 `/ppt` 和 `/ppt/123` 时:
- ✅ 应该看到 `mockNativeAd` 的占位卡片
- ✅ 滚动到广告卡片50%可见时触发 `onImpression`
- ✅ 控制台应输出日志

**验证建议**:
```javascript
// 浏览器控制台检查
console.log('查看是否有 NativeAdCard impression 日志');
```

---

## 任务2: 下载广告流程分析 ⚠️

### 问题诊断

#### 配置检查

**adReward 配置** (`src/config/website.tsx` 第214-222行):
```tsx
adReward: {
  enable: true,                    // ✅ 已启用
  creditsPerWatch: 5,              // ✅ 每次观看奖励5积分
  watchDuration: 30,               // ✅ 前端倒计时30秒
  minWatchDuration: 25,            // ✅ 后端验证最少25秒
  tokenExpireMinutes: 5,           // ✅ token 5分钟过期
  dailyLimitPerUser: 10,           // ✅ 每用户每天10次
  dailyLimitPerIP: 20,             // ✅ 每IP每天20次
}
```

#### UI 组件检查

**下载选项显示** (`download-modal.tsx` 第161-169行):
```tsx
{
  type: 'ad',
  label: '观看广告下载',
  rewardCredits: adRewardConfig.creditsPerWatch,
  description: `观看30秒广告，获得5积分并下载`,
  icon: '📺',
  enabled: adRewardConfig.enable,  // ✅ 应该为 true
  disabledReason: '广告功能暂未开放',
}
```

#### 点击流程检查

**handleContinue 函数** (第239-253行):
```tsx
const handleContinue = () => {
  setError(null);
  if (selectedMethod === 'register') {
    toast.info('请先完成注册');
    onOpenChange(false);
    return;
  }
  if (selectedMethod === 'ad') {
    handleStartAdWatch();  // ✅ 应该调用此函数
  } else if (selectedMethod === 'firstFree') {
    handleGenerateLink();
  } else {
    setStep(2);
  }
};
```

**handleStartAdWatch 函数** (第187-210行):
```tsx
const handleStartAdWatch = async () => {
  setIsProcessing(true);
  setError(null);
  try {
    const res = await fetch('/api/ad/start-watch', {  // ✅ API端点
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pptId: ppt.id }),
    });
    const json = await res.json();

    if (json.success && json.data) {
      setWatchToken(json.data.watchToken);
      setAdCountdown(json.data.duration || adRewardConfig.watchDuration);
      setStep(2);  // 切换到步骤2
    } else {
      setError(json.error || '启动广告失败');
    }
  } catch (err) {
    setError('启动广告失败，请稍后重试');
  } finally {
    setIsProcessing(false);
  }
};
```

#### API 端点检查

**✅ API 路由存在**:
- `/api/ad/start-watch/route.ts` - 存在
- `/api/ad/complete-watch/route.ts` - 存在

**start-watch API** (第1-34行):
```tsx
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pptId } = body;
    
    if (!pptId) {
      return NextResponse.json(
        { success: false, error: 'pptId is required' },
        { status: 400 }
      );
    }

    const result = await startAdWatchAction({ pptId });  // ⚠️ 调用 action
    
    if (!result?.data) {
      return NextResponse.json(
        { success: false, error: 'Action failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('POST /api/ad/start-watch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🔍 问题根源分析

### 可能的原因

#### 1. ⚠️ Action 文件缺失或错误

**检查结果**:
- API 路由调用 `startAdWatchAction` 和 `completeAdWatchAction`
- 需要检查 `src/actions/ad/` 目录下是否有这些action文件
- 找到: `src/actions/ppt/download-status.ts` (但不是广告相关)

**问题**: 可能缺少以下 action 文件:
- `src/actions/ad/start-watch.ts`
- `src/actions/ad/complete-watch.ts`

#### 2. ⚠️ 数据库表缺失

根据广告功能设计，需要以下数据库表:
- `ad_watch_record` - 广告观看记录
- 可能还需要用户积分相关表

#### 3. ⚠️ 按钮禁用状态

检查下载选项是否被正确启用。

---

## 调试步骤建议

### 步骤1: 浏览器测试

1. 访问任意 PPT 详情页
2. 点击"下载"按钮
3. **打开浏览器开发者工具 → Network 标签**
4. 选择"观看广告下载"
5. 点击"继续"按钮
6. 观察:
   - ✅ Network 中是否有 `/api/ad/start-watch` 请求
   - ✅ 请求状态码 (200/400/500)
   - ✅ 响应内容
   - ✅ console 是否有错误日志

### 步骤2: 控制台检查

```javascript
// 检查配置
console.log(websiteConfig.adReward);

// 检查选项状态
// 在下载modal打开时
console.log(downloadOptions.find(o => o.type === 'ad'));
```

### 步骤3: 后端日志

检查终端中的服务器日志:
```bash
# 查看是否有以下日志
POST /api/ad/start-watch error:
```

---

## 修复建议

### 优先级 P0: 检查 Action 文件

需要确认以下文件是否存在和正确实现:

1. `src/actions/ad/start-watch.ts`
2. `src/actions/ad/complete-watch.ts`

如果缺失，需要创建这些 action 文件，实现:
- 生成 watchToken
- 验证观看时长
- 奖励积分
- 数据库写入

### 优先级 P1: 数据库迁移

确保以下表存在:
```sql
-- ad_watch_record 表
CREATE TABLE ad_watch_record (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ppt_id TEXT,
  watch_token TEXT UNIQUE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  credits_awarded INTEGER,
  ip_address TEXT,
  user_agent TEXT
);

-- 用户下载历史表
CREATE TABLE user_download_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ppt_id TEXT,
  download_method TEXT,  -- 'firstFree' | 'credits' | 'ad'
  credits_spent INTEGER,
  created_at TIMESTAMP
);
```

### 优先级 P2: 前端错误处理

改进错误提示，让用户知道具体什么问题。

---

## 总结

### ✅ 正常的部分
1. NativeAdCard 组件完整且正确集成
2. UI 配置正确 (adReward.enable = true)
3. API 路由文件存在
4. 前端逻辑流程正确

### ⚠️ 需要检查的部分
1. **Action 文件是否存在**
2. **数据库表是否创建**
3. **实际的 API 响应是什么**

### 🔧 下一步行动
1. 使用浏览器 DevTools 测试，获取实际错误信息
2. 检查服务器日志
3. 确认 action 文件状态
4根据错误信息进行针对性修复
