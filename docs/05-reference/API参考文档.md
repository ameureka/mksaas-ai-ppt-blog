# API 参考文档

本文档基于 `src/app/api/` 目录的实际代码生成，准确反映项目当前的 API 结构。

**最后更新:** 2026-01-02

---

## 快速导航

```
API Routes (26个)
├─ 认证 (1)           /api/auth/[...all]
├─ AI 功能 (3)        /api/chat, /api/generate-images, /api/analyze-content
├─ PPT 系统 (7)       /api/ppts/*
├─ 搜索系统 (5)       /api/search/*, /api/hot-keywords
├─ 广告系统 (2)       /api/ad/*
├─ 存储 (1)           /api/storage/upload
├─ 支付 (2)           /api/webhooks/stripe, /api/distribute-credits
├─ 管理员 (2)         /api/admin/pinned-keywords/*
├─ CRON 任务 (2)      /api/cron/*
└─ 健康检查 (1)       /api/ping
```

---

## 认证 API

### `GET/POST /api/auth/[...all]`

Better Auth 处理的所有认证端点。

**代码位置:** `src/app/api/auth/[...all]/route.ts`

**支持的端点:**
- `/api/auth/sign-in` - 登录
- `/api/auth/sign-up` - 注册
- `/api/auth/sign-out` - 登出
- `/api/auth/session` - 获取会话
- `/api/auth/callback/*` - OAuth 回调

---

## AI 功能 API

### `POST /api/chat`

AI 对话接口，支持可选的 Web 搜索功能。

**代码位置:** `src/app/api/chat/route.ts`

**请求体:**
```typescript
{
  messages: Message[]      // 对话历史
  webSearch?: boolean      // 是否启用 Web 搜索 (使用 Perplexity)
}
```

---

### `POST /api/generate-images`

AI 图像生成接口，支持多个 Provider。

**代码位置:** `src/app/api/generate-images/route.ts`

**Provider 配置:** `src/ai/image/lib/provider-config.ts`

---

### `POST /api/analyze-content`

Web 内容分析接口，使用 Firecrawl 抓取后 AI 总结。

**代码位置:** `src/app/api/analyze-content/route.ts`

**请求体:**
```typescript
{
  url: string              // 要分析的网页 URL
}
```

---

## PPT 系统 API

### `GET /api/ppts`

获取 PPT 模板列表。

**代码位置:** `src/app/api/ppts/route.ts`

**查询参数:**
- `page` - 页码
- `limit` - 每页数量
- `category` - 分类过滤
- `search` - 搜索关键词

---

### `GET /api/ppts/[id]`

获取单个 PPT 模板详情。

**代码位置:** `src/app/api/ppts/[id]/route.ts`

---

### `GET /api/ppts/[id]/download`

下载 PPT 模板文件。

**代码位置:** `src/app/api/ppts/[id]/download/route.ts`

**权限:** 需要认证

---

### `GET /api/ppts/[id]/download-status`

检查用户对该 PPT 的下载状态。

**代码位置:** `src/app/api/ppts/[id]/download-status/route.ts`

---

### `POST /api/ppts/[id]/view`

记录 PPT 浏览次数。

**代码位置:** `src/app/api/ppts/[id]/view/route.ts`

---

### `GET /api/ppts/featured`

获取精选/推荐 PPT 模板。

**代码位置:** `src/app/api/ppts/featured/route.ts`

---

### `GET /api/ppts/stats`

获取 PPT 统计数据 (管理员)。

**代码位置:** `src/app/api/ppts/stats/route.ts`

---

## 搜索系统 API

### `GET /api/search`

文档搜索接口，使用 Fumadocs + Orama，支持中文分词。

**代码位置:** `src/app/api/search/route.ts`

---

### `GET /api/search/suggestions`

搜索建议/自动补全。

**代码位置:** `src/app/api/search/suggestions/route.ts`

---

### `POST /api/search/click`

记录搜索点击事件。

**代码位置:** `src/app/api/search/click/route.ts`

---

### `POST /api/search/sync-history`

同步搜索历史。

**代码位置:** `src/app/api/search/sync-history/route.ts`

---

### `GET /api/hot-keywords`

获取热门搜索关键词。

**代码位置:** `src/app/api/hot-keywords/route.ts`

---

## 广告系统 API

### `POST /api/ad/start-watch`

开始观看激励广告。

**代码位置:** `src/app/api/ad/start-watch/route.ts`

**说明:** 记录广告观看开始时间。

---

### `POST /api/ad/complete-watch`

完成广告观看，获取奖励。

**代码位置:** `src/app/api/ad/complete-watch/route.ts`

**说明:** 验证观看时长，发放奖励积分。

---

## 存储 API

### `POST /api/storage/upload`

文件上传接口。

**代码位置:** `src/app/api/storage/upload/route.ts`

**请求格式:** `multipart/form-data`

**配置:** `src/storage/config/storage-config.ts`

**限制:**
- 文件大小和类型由配置控制
- 使用 S3 兼容存储 (Cloudflare R2)

---

## 支付 API

### `POST /api/webhooks/stripe`

Stripe Webhook 处理端点。

**代码位置:** `src/app/api/webhooks/stripe/route.ts`

**支持事件:**
- `checkout.session.completed` - 支付完成
- `invoice.payment_succeeded` - 发票支付成功
- `customer.subscription.deleted` - 订阅取消
- `customer.subscription.updated` - 订阅更新

**安全:** 需要 Stripe 签名验证

---

### `POST /api/distribute-credits`

积分分发接口。

**代码位置:** `src/app/api/distribute-credits/route.ts`

---

## 管理员 API

### `GET/POST /api/admin/pinned-keywords`

管理置顶关键词列表。

**代码位置:** `src/app/api/admin/pinned-keywords/route.ts`

**权限:** 管理员

---

### `PATCH/DELETE /api/admin/pinned-keywords/[id]`

更新或删除单个置顶关键词。

**代码位置:** `src/app/api/admin/pinned-keywords/[id]/route.ts`

**权限:** 管理员

---

## CRON 任务 API

### `GET /api/cron/update-hot-keywords`

定时更新热门关键词。

**代码位置:** `src/app/api/cron/update-hot-keywords/route.ts`

**触发:** Vercel Cron 或外部调度器

---

### `GET /api/cron/repair-embeddings`

修复 PPT 向量嵌入。

**代码位置:** `src/app/api/cron/repair-embeddings/route.ts`

**触发:** Vercel Cron 或外部调度器

---

## 健康检查

### `GET /api/ping`

健康检查端点。

**代码位置:** `src/app/api/ping/route.ts`

**响应:** `{ status: 'ok' }`

---

## Server Actions

项目主要使用 Server Actions 处理业务逻辑，而非 REST API。

**位置:** `src/actions/`

### 主要 Action 分类

| 目录 | 功能 |
|------|------|
| `src/actions/user/` | 用户相关操作 |
| `src/actions/admin/` | 管理员操作 |
| `src/actions/ppt/` | PPT 管理 CRUD |
| `src/actions/search/` | 搜索相关 |
| `src/actions/hot-keywords.ts` | 热词管理 |

### 支付相关 Actions

| Action | 文件 |
|--------|------|
| `createCheckoutSession` | `src/actions/create-checkout-session.ts` |
| `createCustomerPortalSession` | `src/actions/create-customer-portal-session.ts` |
| `checkPaymentCompletion` | `src/actions/check-payment-completion.ts` |
| `createCreditCheckoutSession` | `src/actions/create-credit-checkout-session.ts` |
| `consumeCredits` | `src/actions/consume-credits.ts` |
| `getCreditBalance` | `src/actions/get-credit-balance.ts` |
| `getCreditStats` | `src/actions/get-credit-stats.ts` |
| `getCreditTransactions` | `src/actions/get-credit-transactions.ts` |
| `getCurrentPlan` | `src/actions/get-current-plan.ts` |

---

## 相关文档

- [支付系统文档](../04-modules/payment/overview.md)
- [存储系统文档](../04-modules/storage/overview.md)
- [部署指南](./deployment/guide.md)

---

**注意:** 本文档仅包含 API Routes。业务逻辑主要通过 Server Actions (`src/actions/`) 实现，这是 Next.js 15 的推荐模式。
