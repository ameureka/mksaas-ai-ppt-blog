# PPT 广告下载功能 - 数据库配置指南

## 问题根源

用户报告"观看广告下载"点击无反应。经分析，所有代码文件已正确实现，**问题在于数据库表尚未创建**。

---

## 数据库配置

### 需要创建的表

1. **ad_watch_record** - 广告观看记录表
2. **user_download_history** - 用户下载历史表

### SQL 脚本

已生成 SQL 脚本: `migrations/create_ad_tables.sql`

---

## 执行步骤

### 方法1: 使用 Neon 控制台（推荐）

1. 访问 [Neon Console](https://console.neon.tech/)
2. 选择你的项目 `neondb`
3. 进入 SQL Editor
4. 复制并执行以下SQL：

```sql
-- 创建 ad_watch_record 表
CREATE TABLE IF NOT EXISTS "ad_watch_record" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  "ip_address" TEXT,
  "ppt_id" TEXT,
  "watch_token" TEXT NOT NULL UNIQUE,
  "download_token" TEXT,
  "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "completed_at" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "credits_awarded" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "ad_watch_user_id_idx" ON "ad_watch_record"("user_id");
CREATE INDEX IF NOT EXISTS "ad_watch_ip_idx" ON "ad_watch_record"("ip_address");
CREATE INDEX IF NOT EXISTS "ad_watch_token_idx" ON "ad_watch_record"("watch_token");
CREATE INDEX IF NOT EXISTS "ad_watch_created_idx" ON "ad_watch_record"("created_at");
CREATE INDEX IF NOT EXISTS "ad_watch_status_idx" ON "ad_watch_record"("status");

-- 创建 user_download_history 表
CREATE TABLE IF NOT EXISTS "user_download_history" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  "ppt_id" TEXT NOT NULL,
  "download_method" TEXT NOT NULL,
  "credits_spent" INTEGER DEFAULT 0,
  "ip_address" TEXT,
  "downloaded_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "download_user_ppt_idx" ON "user_download_history"("user_id", "ppt_id");
CREATE INDEX IF NOT EXISTS "download_user_idx" ON "user_download_history"("user_id");
CREATE INDEX IF NOT EXISTS "download_ppt_idx" ON "user_download_history"("ppt_id");
CREATE INDEX IF NOT EXISTS "download_method_idx" ON "user_download_history"("download_method");
```

5. 点击 Run 执行

### 方法2: 使用 psql 命令行

如果已安装 psql:
```bash
cd /Users/ameureka/Desktop/mksaas-ai-ppt-blog
psql "postgresql://neondb_owner:npg_iAq3klBrmx2O@ep-silent-dream-a1w2dlyp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f migrations/create_ad_tables.sql
```

---

## 验证步骤

### 1. 确认表已创建

在 Neon Console SQL Editor 中执行：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('ad_watch_record', 'user_download_history');
```

应该返回两行记录。

### 2. 浏览器测试

1. 访问任何PPT详情页（例如：http://localhost:3005/ppt/xxx）
2. **打开浏览器开发者工具** → Network标签
3. 点击"下载"按钮
4. 选择"观看广告下载"
5. 点击"继续"
6. 观察：
   - ✅ Network中应出现 `/api/ad/start-watch` 请求
   - ✅ 状态码应为 200
   - ✅ 响应应包含 `watchToken`
   - ✅ 自动进入步骤2（广告倒计时）

### 3. 完整流程测试

**预期行为**:

1. **步骤1 - 选择方式**: 看到"观看广告下载"选项
2. **点击继续**: 调用 API，进入步骤2  
3. **步骤2 - 倒计时**: 
   - 显示广告占位符
   - 倒计时从30秒开始
   - 进度条动画
4. **倒计时结束**: 自动调用 `/api/ad/complete-watch`
5. **步骤3 - 下载**: 
   - 显示"下载链接已生成"
   - 显示下载链接
   - 可以复制和下载

---

## 常见问题排查

### 问题: API返回500错误

**检查**:
```sql
-- 确认表确实存在
\dt ad_watch_record
\dt user_download_history
```

### 问题: 点击无反应

1. 检查Console是否有JavaScript错误
2. 检查Network是否有请求发出
3. 检查按钮是否被禁用

### 问题: Token验证失败

检查数据库记录：
```sql
SELECT * FROM ad_watch_record ORDER BY created_at DESC LIMIT 5;
```

---

## 完成后状态

- [ ] 数据库表已创建
- [ ] 浏览器测试通过
- [ ] 广告倒计时正常
- [ ] 积分奖励正常
- [ ] 下载链接生成成功
