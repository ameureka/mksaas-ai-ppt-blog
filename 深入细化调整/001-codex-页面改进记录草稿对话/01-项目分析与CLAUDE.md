# 01 - 项目分析与 CLAUDE.md 创建

## 时间线
会话初期

## 主要任务
1. 分析 MkSaaS 代码库架构
2. 创建/改进 CLAUDE.md 项目指导文档

## 项目架构分析结果

### 技术栈
- **框架**: Next.js 15 (App Router) + TypeScript
- **数据库**: Drizzle ORM + PostgreSQL
- **认证**: Better Auth (支持 admin plugin)
- **支付**: Stripe
- **邮件**: React Email + Resend
- **存储**: S3-compatible (Cloudflare R2)
- **UI**: Radix UI + Tailwind CSS
- **状态管理**: Zustand (客户端) + TanStack Query (服务端)
- **表单**: React Hook Form + Zod
- **AI**: ai SDK (OpenAI, Fireworks, Replicate, FAL, Google, DeepSeek, OpenRouter)
- **内容**: Fumadocs (MDX)
- **国际化**: next-intl (en/zh)
- **代码规范**: Biome

### 核心模块

#### 1. 路由结构
```
src/app/[locale]/
  ├── (marketing)/          # 营销页面
  │   ├── (home)/           # 首页
  │   ├── blog/             # 博客
  │   ├── ppt/              # PPT模板（新增）
  │   ├── ai/               # AI演示
  │   └── pages/            # 其他页面
  ├── (protected)/          # 受保护路由
  │   ├── dashboard/        # 用户仪表板
  │   ├── settings/         # 用户设置
  │   └── admin/            # 管理后台
  └── auth/                 # 认证页面
```

#### 2. PPT 模块架构
```
PPT模块/
├── 前台页面
│   ├── /ppt                           # 搜索列表页
│   ├── /ppt/[id]                      # 详情页
│   ├── /ppt/categories                # 分类列表
│   └── /ppt/category/[name]           # 分类详情
├── 后台管理
│   ├── /admin/ppt                     # 统计概览
│   ├── /admin/ppt/list                # PPT管理列表
│   └── /admin/stats                   # 统计分析
└── 数据层
    ├── src/db/schema.ts               # Drizzle schema
    ├── src/actions/ppt/               # Server Actions
    └── src/hooks/ppt/                 # TanStack Query hooks
```

#### 3. 数据库表结构
```sql
ppt (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  title TEXT NOT NULL,
  author TEXT,
  slides_count INTEGER DEFAULT 0,
  file_url TEXT NOT NULL,
  cover_image_url TEXT,
  thumbnail_url TEXT,
  category TEXT,
  tags TEXT[],
  language TEXT,
  status TEXT DEFAULT 'draft',
  visibility TEXT,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 关键索引
```sql
CREATE INDEX ppt_category_idx ON ppt(category);
CREATE INDEX ppt_download_count_idx ON ppt(download_count);
CREATE INDEX ppt_view_count_idx ON ppt(view_count);
CREATE INDEX ppt_created_at_idx ON ppt(created_at);
```

## CLAUDE.md 更新内容

### 新增 PPT 管理系统部分
1. **功能特性**
   - 模板列表与搜索
   - 模板详情与预览
   - 管理后台
   - 下载流程
   - 统计分析

2. **组件结构**
   - 营销组件 (`src/components/ppt/`)
   - 下载流程 (`src/components/ppt/download/`)
   - 广告系统 (`src/components/ppt/ads/`)
   - 认证组件 (`src/components/ppt/auth/`)
   - 管理组件 (`src/components/ppt/admin/`)

3. **Hooks 模式**
   - 使用 TanStack Query 进行数据获取
   - 所有 hooks 在 `src/hooks/ppt/`
   - 统一的命名规范：`use-*`

4. **Server Actions**
   - CRUD 操作在 `src/actions/ppt/ppt.ts`
   - 统计查询在 `src/actions/ppt/stats.ts`
   - 用户操作在 `src/actions/ppt/user.ts`

### 开发流程文档
1. **快速启动命令**
   ```bash
   pnpm install
   pnpm dev  # 端口 3005
   pnpm build && pnpm start
   ```

2. **数据库操作**
   ```bash
   pnpm db:generate  # 生成迁移
   pnpm db:migrate   # 执行迁移
   pnpm db:push      # 推送到数据库
   pnpm db:studio    # 打开 Drizzle Studio
   ```

3. **代码规范**
   ```bash
   pnpm lint    # Biome 检查并修复
   pnpm format  # Biome 格式化
   ```

## 设计原则

### 1. 设计优先原则
- **先设计，后实现**：所有功能先在设计文档中规划
- **设计文档位置**：`深入细化调整/002-分割任务-01页面-搜索-主页/`
- **必须等待审核**：设计文档需要用户审核后才能开始编码

### 2. SSR 优先原则
- 使用 Next.js Server Components
- Server Actions 处理数据变更
- API Routes 仅在必要时使用

### 3. 国际化原则
- 所有用户可见文本使用 `useTranslations()` 或 `getTranslations()`
- 翻译文件：`messages/en.json` 和 `messages/zh.json`
- 避免硬编码字符串

### 4. 类型安全原则
- 使用 TypeScript 所有新代码
- Schema 使用 Zod 验证
- Drizzle 提供类型推断

## 关键配置

### 环境变量要求
必须配置：
- `DATABASE_URL` - PostgreSQL 连接字符串
- `BETTER_AUTH_SECRET` - 认证密钥
- Google/GitHub OAuth 密钥
- Stripe 密钥和价格 ID
- Resend API 密钥
- S3/R2 存储凭证
- `NEXT_PUBLIC_BASE_URL`

### Feature Flags
在 `src/config/website.tsx` 中：
```typescript
features: {
  pptRequireLoginForDownload: false,  // 下载是否需要登录
  // ... 其他功能开关
}
```

## 项目命令速查

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（3005端口） |
| `pnpm build` | 构建生产版本 |
| `pnpm db:generate` | 生成数据库迁移 |
| `pnpm db:migrate` | 执行迁移 |
| `pnpm db:studio` | 打开数据库可视化工具 |
| `pnpm lint` | 代码检查和修复 |
| `pnpm content` | 处理 MDX 内容 |
| `pnpm email` | 预览邮件模板（3333端口） |

## 下一步
- 阅读前端验证报告
- 理解现有 PPT 模块实现
- 规划数据库集成
