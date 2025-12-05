# PPT 广告下载功能修复实施计划

## 问题现状

用户报告：**"观看广告下载"点击无反应**

## 代码审查结果 ✅

### 所有文件已确认存在

1. ✅ **UI组件**: `src/components/ppt/download/download-modal.tsx`
2. ✅ **API端点**: 
   - `/api/ad/start-watch/route.ts`
   - `/api/ad/complete-watch/route.ts`
3. ✅ **Action文件**:
   - `src/actions/ad/start-watch.ts`
   - `src/actions/ad/complete-watch.ts`
   - `src/actions/ad/types.ts`
4. ✅ **库文件**:
   - `src/lib/ad-watch-limiter.ts`
   - `src/lib/ad-watch/token-service.ts`
5. ✅ **数据库Schema**:
   - `adWatchRecord` 表定义 (schema.ts 第161-179行)
   - `userDownloadHistory` 表定义 (schema.ts 第185-198行)
6. ✅ **配置**: `adReward.enable = true`

### 代码逻辑正确性

- handleStartAdWatch 函数逻辑正确
- API调用流程正确
- Token生成和验证逻辑完整

---

## 可能的问题根源

### 1. 数据库表未创建 ⚠️

虽然schema定义存在，但可能需要运行数据库迁移。

### 2. 环境依赖缺失

可能缺少某些运行时依赖。

### 3. 前端状态问题

按钮可能被禁用或事件未正确绑定。

---

## 修复步骤

### 步骤1: 检查数据库迁移

```bash
# 检查数据库状态
pnpm db:push
# 或
pnpm db:migrate
```

### 步骤2: 浏览器实际测试

1. 访问任意PPT详情页
2. 打开开发者工具 (F12)
3. 切换到 Network 标签
4. 点击"下载"按钮
5. 选择"观看广告下载"
6. 点击"继续"
7. 观察：
   - Network请求
   - Console错误
   - 响应内容

### 步骤3: 根据错误修复

基于实际错误信息进行针对性修复。

---

## 验证计划

### 功能测试

1. **启动广告观看**:
   - 点击"观看广告下载"
   - 确认进入步骤2（广告倒计时）
   - Network应显示成功的 `/api/ad/start-watch` 请求

2. **广告倒计时**:
   - 倒计时从30秒开始
   - 每秒递减
   - 进度条正常显示

3. **完成观看**:
   - 倒计时结束后自动调用 `/api/ad/complete-watch`
   - 成功获得积分
   - 显示成功消息

4. **生成下载链接**:
   - 进入步骤3
   - 显示下载链接
   - 可以复制和下载

### 数据验证

检查数据库记录：
```sql
-- 检查广告观看记录
SELECT * FROM ad_watch_record ORDER BY created_at DESC LIMIT 5;

-- 检查用户积分变化
SELECT * FROM credit_transaction WHERE type = 'AD_REWARD' ORDER BY created_at DESC LIMIT 5;

-- 检查下载历史
SELECT * FROM user_download_history WHERE download_method = 'ad' ORDER BY downloaded_at DESC LIMIT 5;
```

---

## 时间估计

- 数据库检查: 5分钟
- 浏览器测试: 10分钟
- 修复(如需要): 15-30分钟
- 最终验证: 10分钟

**总计**: 约40-55分钟

---

## 下一步行动

1. 运行 `pnpm db:push` 确保数据库表存在
2. 使用浏览器进行实际测试
3. 收集错误信息
4. 针对性修复
