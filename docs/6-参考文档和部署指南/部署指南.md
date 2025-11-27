# 部署指南

将 mk-saas-blog 应用部署到生产环境的完整指南。

---

## 快速概览

```
部署选项:
┌────────────────────────────────────────┐
│ 选项          │ 难度 │ 成本   │ 推荐     │
├────────────────────────────────────────┤
│ Vercel (推荐) │ ⭐   │ 便宜   │ ✅      │
│ Docker        │ ⭐⭐⭐ │ 中等   │ 可选     │
│ AWS/GCP       │ ⭐⭐⭐ │ 昂贵   │ 企业级   │
│ 自托管        │ ⭐⭐⭐ │ 便宜   │ 不推荐   │
└────────────────────────────────────────┘
```

---

## 前置准备

### 1. 检查清单

```
部署前检查:
☐ 所有环境变量都已配置
☐ 数据库备份已创建
☐ 代码审查已完成
☐ 测试全部通过
☐ 性能优化已执行
☐ 安全漏洞已修复
☐ DNS 已配置
☐ SSL 证书已准备
```

---

### 2. 关键配置

```bash
# 构建配置
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com

# 数据库
DATABASE_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# 认证
AUTH_SECRET=<256 位随机字符串>
AUTH_TRUST_HOST=yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# 其他
SENTRY_DSN=...
DATADOG_API_KEY=...
```

---

## Vercel 部署（推荐）

### 步骤 1: 连接 Git 仓库

```bash
# 在 vercel.com 上创建账户
# 1. 点击 "New Project"
# 2. 导入你的 GitHub 仓库
# 3. Vercel 会自动检测 Next.js 项目
```

---

### 步骤 2: 配置环境变量

在 Vercel 仪表板中：

```
Settings → Environment Variables

添加所有生产环境变量:
- DATABASE_URL
- AUTH_SECRET
- STRIPE_SECRET_KEY
- ...
```

---

### 步骤 3: 配置数据库连接

```typescript
// vercel.json
{
  "env": {
    "DATABASE_URL": "@database_url_secret"
  },
  "buildCommand": "pnpm db:migrate && pnpm build",
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  }
}
```

---

### 步骤 4: 部署

```bash
# 方式 1: 自动部署（推荐）
# 推送到 main 分支时自动部署
git push origin main

# 方式 2: 手动部署
# 在 Vercel 仪表板点击 "Deploy"

# 方式 3: Vercel CLI
pnpm add -D vercel
vercel deploy --prod
```

---

### 步骤 5: 部署后检查

```
部署完成后:
☐ 检查部署日志没有错误
☐ 访问网站首页
☐ 测试登录功能
☐ 测试支付流程
☐ 检查数据库连接
☐ 查看 Vercel Analytics
```

---

## 自托管部署（Docker）

### 步骤 1: 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

---

### 步骤 2: 创建 docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mk_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/mk_saas
      AUTH_SECRET: ${AUTH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

### 步骤 3: 构建和运行

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up -d

# 检查日志
docker-compose logs -f app

# 停止
docker-compose down
```

---

## 数据库迁移

### 在 Vercel 上

```bash
# 1. 在 Vercel 部署前，连接数据库
vercel env pull  # 拉取环境变量

# 2. 运行迁移
pnpm db:migrate

# 3. 部署
git push origin main
```

---

### 在 Docker 上

```bash
# 在 docker-compose.yml 中添加初始化脚本

# docker-entrypoint.sh
#!/bin/bash
set -e

echo "等待数据库启动..."
until nc -z postgres 5432; do
  sleep 1
done

echo "运行数据库迁移..."
pnpm db:migrate

echo "启动应用..."
exec node server.js
```

---

## 监控和日志

### Vercel 内置监控

```
Vercel 仪表板 → Analytics 标签页

监控指标:
- Web Vitals (LCP, FID, CLS)
- 页面加载时间
- 服务器响应时间
- 错误率
```

---

### Sentry 错误追踪

```bash
# 1. 安装
pnpm add @sentry/nextjs

# 2. 初始化 (sentry.client.config.js)
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

```typescript
// 在 page.tsx 中捕获错误
try {
  // 业务逻辑
} catch (error) {
  Sentry.captureException(error)
}
```

---

### DataDog 性能监控

```bash
# 1. 安装 DD tracer
pnpm add dd-trace

# 2. 配置 (server.js)
const tracer = require('dd-trace').init({
  logInjection: true,
  analytics: true,
})

# 3. 配置环境变量
DD_TRACE_ENABLED=true
DD_API_KEY=...
```

---

### 日志聚合

```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

// 使用
logger.info('用户登录', { userId: user.id })
logger.error('支付失败', { error: err.message })
```

---

## 性能优化

### 1. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src="/user-avatar.png"
  alt="用户头像"
  width={100}
  height={100}
  priority // 首屏图片
/>
```

---

### 2. 代码分割

```typescript
// 动态导入重型组件
import dynamic from 'next/dynamic'

const PaymentForm = dynamic(() => import('@/components/PaymentForm'), {
  loading: () => <LoadingSpinner />,
})
```

---

### 3. API 路由缓存

```typescript
// ISR - 增量静态再生
export const revalidate = 3600  // 1 小时

export async function generateStaticParams() {
  const posts = await db.query.post.findMany()
  return posts.map(post => ({ slug: post.slug }))
}
```

---

### 4. 数据库查询优化

```typescript
// 使用索引查询
const user = await db
  .select()
  .from(userTable)
  .where(eq(userTable.email, email))
  .limit(1)

// 避免 N+1 查询
const users = await db.query.user.findMany({
  with: {
    posts: true,  // 一次加载关联数据
  },
})
```

---

## 安全检查

### 1. HTTPS 和 SSL

```
Vercel: 自动配置 SSL 证书
自托管: 使用 Let's Encrypt

certbot certonly --standalone -d yourdomain.com
```

---

### 2. 环境变量

```bash
# ✅ 正确：使用环境变量
DATABASE_URL=${DATABASE_URL}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}

# ❌ 错误：硬编码密钥
const stripe = new Stripe('sk_live_123456')
```

---

### 3. CORS 配置

```typescript
// src/lib/cors.ts
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
]

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')

  if (!origin || !allowedOrigins.includes(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
```

---

### 4. API 速率限制

```typescript
// 使用 Upstash Redis 实现
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
})

const { success } = await ratelimit.limit(request.ip || 'anonymous')

if (!success) {
  return NextResponse.json(
    { error: '请求过于频繁' },
    { status: 429 }
  )
}
```

---

## 回滚策略

### Vercel 回滚

```
Vercel 仪表板 → Deployments

1. 找到之前的部署
2. 点击 "Restore"
3. 确认回滚
```

---

### 数据库回滚

```bash
# 备份当前数据库
pg_dump -h localhost -U postgres mk_saas > backup.sql

# 查看迁移历史
SELECT * FROM _drizzle_migrations

# 回滚到特定版本
# 编辑 drizzle 迁移文件
pnpm db:migrate
```

---

## 上线检查清单

```
部署完成后检查:

功能测试:
☐ 首页加载正常
☐ 用户注册和登录
☐ 创建和编辑博客文章
☐ 支付流程完整
☐ 用户资料修改
☐ 管理员功能

性能检查:
☐ 首页加载时间 < 3s
☐ API 响应时间 < 500ms
☐ Lighthouse 评分 > 80
☐ 没有 JavaScript 错误

安全检查:
☐ HTTPS 工作正常
☐ 没有 CORS 错误
☐ 密钥没有泄露
☐ 数据库连接安全

监控设置:
☐ Sentry 正常接收错误
☐ DataDog 记录性能指标
☐ 日志聚合工作正常
☐ 告警规则已配置
```

---

## 常见问题

### Q: 部署后数据库连接失败？

**A:**
1. 检查 DATABASE_URL 环境变量
2. 确保数据库在线
3. 检查防火墙规则
4. 运行迁移: `pnpm db:migrate`

---

### Q: Stripe webhook 不工作？

**A:**
1. 检查 STRIPE_WEBHOOK_SECRET
2. 在 Stripe 仪表板配置 webhook URL
3. 确保端点返回 200 OK
4. 查看 Stripe 日志

---

### Q: 静态资源 404？

**A:**
1. 检查 public/ 目录
2. 使用相对路径: `/images/logo.png`
3. 确保文件存在
4. 清除 Vercel 缓存

---

## 总结

✅ **Vercel 部署** - 最简单，推荐
✅ **Docker 部署** - 灵活，自托管
✅ **监控工具** - Sentry, DataDog
✅ **安全加固** - HTTPS, API 限流
✅ **回滚策略** - 快速恢复

---

**相关文档:**
- [环境变量参考](./环境变量参考.md)
- [故障排除](./故障排除.md)

**最后更新:** 2025-11-18
