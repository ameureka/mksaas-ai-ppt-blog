# 常见错误处理 (Troubleshooting)

本文档记录项目开发和部署过程中遇到的常见错误及解决方案。

## 目录

- [部署相关](#部署相关)
  - [Vercel Middleware 错误](#vercel-middleware-错误)
- [数据库相关](#数据库相关)
- [认证相关](#认证相关)
- [环境变量相关](#环境变量相关)

---

## 部署相关

### Vercel Middleware 错误

#### 错误信息
```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
ID: hkg1::4dlk8-1764227340195-88b1e0da55c0
```

#### 错误原因

这个错误通常由以下原因引起：

1. **顶层 await 导致的数据库连接错误**
   - Vercel 的 Edge Runtime（middleware 运行环境）不支持直接的数据库连接
   - 在模块顶层使用 `await` 会导致初始化时尝试连接数据库

2. **不兼容的 Edge Runtime 代码**
   - 某些 Node.js API 在 Edge Runtime 中不可用
   - Console.log 过多可能影响性能

#### 解决方案

**1. 修复 `src/lib/auth.ts` 中的顶层 await**

❌ **错误的写法：**
```typescript
export const auth = betterAuth({
  baseURL: getBaseUrl(),
  appName: defaultMessages.Metadata.name,
  database: drizzleAdapter(await getDb(), {  // 顶层 await
    provider: 'pg',
  }),
  // ...
});
```

✅ **正确的写法：**
```typescript
export const auth = betterAuth({
  baseURL: getBaseUrl(),
  appName: defaultMessages.Metadata.name,
  database: drizzleAdapter(getDb, {  // 传递函数引用
    provider: 'pg',
    useMigrations: false,  // 禁用迁移
  }),
  // ...
});
```

**关键点：**
- 传递函数引用 `getDb` 而不是调用结果 `await getDb()`
- 添加 `useMigrations: false` 配置
- Better Auth 会在需要时自动调用该函数

**2. 移除 middleware 中的 console.log**

移除 `src/middleware.ts` 中所有不必要的 console.log 语句，保持代码简洁。

**3. 确保环境变量正确配置**

在 Vercel Dashboard → Project → Settings → Environment Variables 中设置：

必需的环境变量：
- `NEXT_PUBLIC_BASE_URL` - 您的 Vercel 域名（例如：`https://your-app.vercel.app`）
- `DATABASE_URL` - 数据库连接字符串
- `BETTER_AUTH_SECRET` - 认证密钥
- 其他参考 `env.example` 中的配置

#### 验证修复

部署后检查以下功能：

- [ ] 网站首页正常加载
- [ ] 认证流程（登录/注册）正常工作
- [ ] Protected 路由正确重定向到登录页
- [ ] API 路由正常响应
- [ ] 国际化路由正常工作

#### 相关文件

- `src/lib/auth.ts` - Better Auth 配置
- `src/middleware.ts` - Next.js Middleware
- `src/db/index.ts` - 数据库连接
- `vercel.json` - Vercel 配置

#### 参考链接

- [Better Auth Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [Next.js Middleware Edge Runtime](https://nextjs.org/docs/app/building-your-application/routing/middleware#runtime)
- [Vercel Edge Runtime Limitations](https://vercel.com/docs/functions/edge-functions/limitations)

---

## 数据库相关

### 问题待补充

（遇到数据库相关问题时在此记录）

---

## 认证相关

### 问题待补充

（遇到认证相关问题时在此记录）

---

## 环境变量相关

### 缺少必需的环境变量

#### 错误信息
```
Error: Missing environment variable: XXX
```

#### 解决方案

1. 检查 `env.example` 文件，确认所有必需的环境变量
2. 复制 `env.example` 到 `.env.local`（本地开发）
3. 在 Vercel Dashboard 中设置环境变量（生产环境）

#### 环境变量清单

参考 `env.example` 文件中的完整清单。

核心环境变量：
- `NEXT_PUBLIC_BASE_URL` - 应用基础 URL
- `DATABASE_URL` - PostgreSQL 数据库连接
- `BETTER_AUTH_SECRET` - 认证密钥（使用 `openssl rand -base64 32` 生成）
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `RESEND_API_KEY` - 邮件服务
- `STRIPE_SECRET_KEY` - Stripe 支付
- `STORAGE_*` - S3/R2 存储配置

---

## 最佳实践

### 部署前检查清单

- [ ] 运行 `pnpm lint` 检查代码质量
- [ ] 确认所有环境变量已设置
- [ ] 测试本地构建 `pnpm build`
- [ ] 检查 `.gitignore` 不包含敏感文件
- [ ] 确认数据库迁移已运行
- [ ] 测试关键功能流程

### 调试技巧

1. **查看 Vercel 部署日志**
   - 在 Vercel Dashboard → Deployments → 点击具体部署 → 查看 Build Logs 和 Function Logs

2. **本地模拟生产环境**
   ```bash
   pnpm build
   pnpm start
   ```

3. **检查 Edge Runtime 兼容性**
   - 避免使用 Node.js 特定 API（如 fs, path 等）
   - 使用 Web Standard APIs
   - 测试 middleware 在本地是否正常工作

4. **环境变量调试**
   ```bash
   # 检查环境变量是否加载
   console.log('BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
   ```

---

## 更新日志

- **2025-01-27**: 添加 Vercel Middleware 错误解决方案
- **2025-01-27**: 创建文档，添加基本结构

---

## 需要帮助？

如果遇到未在此文档中记录的问题：

1. 查看 [GitHub Issues](https://github.com/yourusername/mksaas-ai-ppt-blog/issues)
2. 查看项目文档：`docs/` 目录
3. 查看相关服务文档：
   - [Next.js Docs](https://nextjs.org/docs)
   - [Better Auth Docs](https://www.better-auth.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
