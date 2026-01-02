# 上线后优化配置指南

本文档记录了项目上线后需要进行的配置优化操作。

---

## 1. 关闭广告功能

### 问题描述
项目启用了 AdSense 测试模式，导致页面上显示白色的广告占位符区域。

### 解决方案

#### 方法一：在 Vercel Dashboard 修改

1. 打开 [Vercel 环境变量设置](https://vercel.com/ameurekas-projects/mksaas-ai-ppt-blog/settings/environment-variables)
2. 修改以下变量：
   | 变量名 | 修改为 |
   |--------|--------|
   | `NEXT_PUBLIC_ADSENSE_ENABLED` | `false` |
   | `NEXT_PUBLIC_ADSENSE_TEST_MODE` | `false` |
3. 保存后点击 **Redeploy** 重新部署

#### 方法二：使用 Vercel CLI

```bash
# 移除旧变量并添加新值
vercel env rm NEXT_PUBLIC_ADSENSE_ENABLED production --yes
vercel env add NEXT_PUBLIC_ADSENSE_ENABLED production
# 输入值: false

# 重新部署
vercel --prod
```

### 相关配置文件
- 本地配置：`.env.local`
- Vercel 配置：`.env.vercel`
- 广告配置逻辑：`src/lib/config/adsense.ts`

---

## 2. 启用 Vercel Web Analytics

### 功能说明
Vercel Web Analytics 提供网站访问统计分析，可在 Vercel Dashboard 的 Analytics 页面查看。

### 已完成的配置

修改文件：`src/config/website.tsx`

```typescript
analytics: {
  enableVercelAnalytics: true,  // 启用网站访问分析
  enableSpeedInsights: true,     // 启用性能分析
},
```

### 查看数据
部署完成后，访问：
- [Analytics 页面](https://vercel.com/ameurekas-projects/mksaas-ai-ppt-blog) → **Analytics** 标签

### 相关依赖
项目已安装：
- `@vercel/analytics`: ^1.5.0
- `@vercel/speed-insights`: 已集成

### 代码实现位置
- Analytics 组件：`src/analytics/analytics.tsx`
- Layout 集成：`src/app/[locale]/layout.tsx` (第 100 行)

---

## 3. Vercel 项目配置概览

### 当前 vercel.json 配置

```json
{
  "crons": [
    {
      "path": "/api/cron/update-hot-keywords",
      "schedule": "0 0 * * *"
    }
  ]
}
```

说明：每天凌晨 00:00 执行热门关键词更新任务。

### 重要环境变量

| 变量 | 用途 | 当前状态 |
|------|------|----------|
| `NEXT_PUBLIC_BASE_URL` | 网站域名 | `https://www.ppthub.shop` |
| `BETTER_AUTH_URL` | 认证回调 | `https://www.ppthub.shop` |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | 广告开关 | `false` (已关闭) |
| `DATABASE_URL` | 数据库连接 | Neon PostgreSQL |
| `STORAGE_ENDPOINT` | 对象存储 | Cloudflare R2 |

---

## 4. 同步 Vercel 配置到本地

```bash
# 拉取最新的 Vercel 环境变量到本地
vercel env pull .env.vercel.latest --yes

# 查看所有环境变量
vercel env ls
```

---

## 更新记录

| 日期 | 操作 | 说明 |
|------|------|------|
| 2025-12-31 | 关闭广告 | 禁用 AdSense 测试模式 |
| 2025-12-31 | 启用分析 | 开启 Vercel Web Analytics 和 Speed Insights |
