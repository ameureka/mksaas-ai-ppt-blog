# QA-6.0 部署策略

## 📋 问题
项目的部署策略是什么？

## ✅ 回答

项目支持 **多平台部署**，提供了 **Vercel**、**Cloudflare Workers** 和 **Docker** 三种部署方案。

### 🚀 部署选项

#### 1. Vercel 部署（推荐，默认）

**优势**:
- ✅ **零配置部署** - Git 推送即部署
- ✅ **边缘函数** - 全球 CDN 加速
- ✅ **预览部署** - 每个 PR 自动部署预览
- ✅ **环境变量管理** - Web 界面管理
- ✅ **Analytics 集成** - 内置性能监控
- ✅ **自动 HTTPS** - 免费 SSL 证书

**部署步骤**:
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

**配置文件**: `vercel.json`

```json
{
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 300  // API 函数最大执行 5 分钟（需 Pro 计划）
    }
  }
}
```

**来源**: `vercel.json`

**项目配置**: `next.config.ts`

```typescript
const nextConfig = {
  // Vercel 自动检测 Next.js
  // 无需特殊配置
  images: {
    unoptimized: true  // 禁用图片优化，避免 1000 张/月限制
  }
};
```

**来源**: `next.config.ts`

**限制**:
- Hobby 计划：
  - 带宽：100GB/月
  - 函数执行时间：10 秒
  - 图片优化：1000 张/月（已禁用）
- Pro 计划（$20/月）：
  - 带宽：1TB/月
  - 函数执行时间：300 秒
  - 图片优化：5000 张/月

**来源**: Vercel 官方定价

#### 2. Cloudflare Workers 部署（边缘计算）

**优势**:
- ✅ **极低延迟** - 全球 300+ 节点
- ✅ **无冷启动** - 即时响应
- ✅ **免费层慷慨** - 100k 请求/天
- ✅ **R2 集成** - 同一网络，零流量费
- ✅ **成本低** - $5/月 1000 万请求

**技术实现**: 使用 **OpenNext.js**

**部署脚本**: `package.json`

```json
{
  "scripts": {
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

**来源**: `package.json`

**部署步骤**:
```bash
# 1. 构建 Cloudflare 版本
pnpm deploy

# 或分步执行
# 1. 构建
opennextjs-cloudflare build

# 2. 本地预览
opennextjs-cloudflare preview

# 3. 部署到 Cloudflare
opennextjs-cloudflare deploy
```

**配置**: 需要 `wrangler.toml`（项目中可能未包含，需手动创建）

**限制**:
- 免费计划：
  - 100,000 请求/天
  - 10ms CPU 时间/请求
- Workers Paid ($5/月)：
  - 10,000,000 请求/月
  - 50ms CPU 时间/请求

**来源**: Cloudflare Workers 官方定价

#### 3. Docker 部署（自托管）

**优势**:
- ✅ **完全控制** - 自定义基础设施
- ✅ **成本可控** - 按实际资源付费
- ✅ **数据主权** - 数据完全掌控
- ✅ **可扩展** - Kubernetes 编排

**配置**: `next.config.ts`

```typescript
const nextConfig = {
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined
};
```

**来源**: `next.config.ts` (条件输出)

**部署步骤**:
```bash
# 1. 构建镜像
DOCKER_BUILD=true pnpm build
docker build -t my-saas-app .

# 2. 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e BETTER_AUTH_SECRET="..." \
  my-saas-app
```

**推荐平台**:
- Railway - $5/月起
- Fly.io - $3/月起
- DigitalOcean App Platform - $5/月起
- AWS ECS / Google Cloud Run

### 🌍 部署架构对比

| 特性 | Vercel | Cloudflare Workers | Docker 自托管 |
|------|--------|-------------------|--------------|
| 部署难度 | ⭐ 极简 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 冷启动 | 有 | 无 | 有 |
| 全球延迟 | 低 | 极低 | 依赖位置 |
| 成本（小规模） | 免费 | 免费 | $5-10/月 |
| 成本（大规模） | $20-200/月 | $5-50/月 | 可变 |
| 函数执行时间 | 10-300 秒 | 50ms CPU | 无限制 |
| 数据库支持 | 推荐 Vercel Postgres | 推荐 Neon/Supabase | 任意 |
| 存储支持 | 任意 | 推荐 R2 | 任意 |

### 📁 部署架构图

#### Vercel 部署架构

```
GitHub Repo
    │
    ├─► Vercel 自动检测 Next.js
    │
    ├─► 构建 (next build)
    │
    ├─► 部署到边缘网络
    │   ├─ 静态页面 → Vercel CDN
    │   ├─ API 路由 → Vercel Functions
    │   └─ Server Components → Vercel Functions
    │
    └─► 连接外部服务
        ├─ Vercel Postgres (数据库)
        ├─ Cloudflare R2 (存储)
        ├─ Stripe (支付)
        └─ Resend (邮件)
```

#### Cloudflare Workers 部署架构

```
GitHub Repo
    │
    ├─► opennextjs-cloudflare build
    │
    ├─► 构建为 Workers 兼容格式
    │
    ├─► 部署到 Cloudflare 边缘
    │   ├─ 静态资源 → R2 + CDN
    │   ├─ API 路由 → Workers
    │   └─ SSR 页面 → Workers
    │
    └─► 连接外部服务
        ├─ Neon/Supabase (数据库)
        ├─ Cloudflare R2 (存储，同网络)
        ├─ Stripe (支付)
        └─ Resend (邮件)
```

#### Docker 自托管架构

```
GitHub Repo
    │
    ├─► DOCKER_BUILD=true next build
    │
    ├─► Docker 镜像构建
    │
    ├─► 部署到容器平台
    │   └─ Next.js 服务器 (standalone 模式)
    │
    └─► 连接外部服务
        ├─ 自托管 PostgreSQL 或云数据库
        ├─ 任意 S3 兼容存储
        ├─ Stripe (支付)
        └─ Resend (邮件)
```

### 🔧 环境变量配置

所有部署方案都需要配置以下环境变量：

**核心配置**:
```bash
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="<32字符随机字符串>"
```

**OAuth**:
```bash
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

**支付**:
```bash
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY="..."
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY="..."
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME="..."
```

**邮件**:
```bash
RESEND_API_KEY="..."
RESEND_AUDIENCE_ID="..."
```

**存储**:
```bash
STORAGE_REGION="auto"
STORAGE_BUCKET_NAME="..."
STORAGE_ACCESS_KEY_ID="..."
STORAGE_SECRET_ACCESS_KEY="..."
STORAGE_ENDPOINT="..."
STORAGE_PUBLIC_URL="..."
```

**来源**: `env.example`

### 🎯 部署建议

#### 小型项目（< 1k 用户）

**推荐**: Vercel Hobby（免费）

**配置**:
- 数据库: Vercel Postgres 免费层 或 Supabase 免费层
- 存储: Cloudflare R2 免费层
- 总成本: **$0/月**

#### 中型项目（1k - 10k 用户）

**推荐**: Vercel Pro（$20/月）或 Cloudflare Workers ($5/月)

**配置**:
- 数据库: Neon Pro ($19/月) 或 Supabase Pro ($25/月)
- 存储: Cloudflare R2 ($1-5/月)
- 总成本: **$25-50/月**

#### 大型项目（> 10k 用户）

**推荐**: Cloudflare Workers 或 Docker 自托管

**配置**:
- 数据库: 专用 PostgreSQL ($50-200/月)
- 存储: Cloudflare R2 ($10-50/月)
- 计算: Cloudflare Workers ($50/月) 或 VPS ($20-100/月)
- 总成本: **$80-350/月**

### 🔄 CI/CD 流程

**Vercel 自动部署**:
```
main 分支推送 → 自动部署到生产环境
其他分支推送 → 自动部署预览环境
Pull Request → 自动部署预览 + 评论 PR
```

**Cloudflare Workers 手动部署**:
```bash
git push origin main
pnpm deploy  # 手动触发部署
```

**Docker 自动部署** (GitHub Actions 示例):
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t app .
      - run: docker push registry/app
      - run: kubectl rollout restart deployment/app
```

### 📊 性能优化

**Next.js 配置**:
```typescript
{
  images: {
    unoptimized: true,           // 避免 Vercel 限制
    remotePatterns: [...]        // 允许的远程图片域名
  },
  redirects: async () => [...],  // 旧 URL 重定向
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'       // Server Actions 体积限制
    }
  }
}
```

**来源**: `next.config.ts`

### 🔒 安全配置

**环境变量**:
- ✅ 使用平台环境变量管理
- ✅ 不要在代码中硬编码密钥
- ✅ 使用 `.env.local` 本地开发

**Webhook 验证**:
- ✅ Stripe webhook 签名验证
- ✅ 使用 HTTPS（所有平台自动提供）

**CORS**:
- ✅ Better Auth 自动处理认证 CORS
- ✅ API 路由按需配置 CORS

## 📍 信息来源
- `vercel.json` - Vercel 配置
- `next.config.ts` - Next.js 配置
- `package.json` - 部署脚本
- `env.example` - 环境变量模板
- Vercel / Cloudflare 官方文档 - 定价和限制
