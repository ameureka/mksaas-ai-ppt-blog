# PPTHub Blog & AI Playground 开发指南

本项目是一个基于 Next.js 15 全栈开发的 PPT 模板平台，集成了 AI 工具（聊天、图像生成、内容分析）、多语言博客、文档系统以及完善的用户认证和支付体系。

## 1. 项目概述

- **核心目标**: 提供 PPT 模板展示与下载，集成 AI 辅助创作工具。
- **主要特性**:
    - **多语言支持**: 使用 `next-intl` 实现中英文切换 (默认语言: 中文)。
    - **全栈架构**: App Router, Server Actions, Drizzle ORM, Better Auth。
    - **AI 集成**: 接入 OpenAI, Fireworks, Replicate, Fal 等多模型，支持聊天和生图。
    - **支付与积分**: Stripe 支付集成，内置积分系统 (Credits) 和广告激励机制。
    - **内容管理**: 基于 MDX 的博客和文档系统 (Fumadocs)。

## 2. 技术栈

- **前端框架**: Next.js 15, React 19, TypeScript
- **样式库**: TailwindCSS 4, Radix UI, Shadcn UI, Motion
- **数据库**: PostgreSQL, Drizzle ORM
- **认证**: Better Auth (支持邮箱验证、Google/GitHub 登录)
- **支付**: Stripe (Checkout & Customer Portal)
- **AI SDK**: Vercel AI SDK
- **邮件服务**: Resend
- **存储**: S3 兼容存储 (AWS S3, Cloudflare R2 等)
- **包管理器**: pnpm

## 3. 快速开始

### 环境配置
1.  复制环境变量文件: `cp env.example .env.local`
2.  配置关键环境变量 (参考 `env.example`):
    - 数据库: `DATABASE_URL`
    - 认证: `BETTER_AUTH_SECRET`, OAuth Client IDs
    - AI 服务: `OPENAI_API_KEY` 等
    - 存储: `STORAGE_*` 相关配置

### 启动开发服务器
```bash
pnpm install
pnpm dev
```
访问: `http://localhost:3005`

## 4. 项目结构

- `src/app`: 应用路由 (App Router)。
    - `[locale]/(marketing)`: 营销页面 (首页、博客、关于等)。
    - `[locale]/(protected)`: 受保护页面 (控制台、设置、管理员后台)。
    - `[locale]/(auth)`: 认证流程页面。
    - `api`: 后端 API 路由 (AI 流式响应、Webhooks、上传等)。
- `src/components`: 组件库。
    - `ui`: 基础 UI 组件 (Shadcn/Radix)。
    - `magicui`, `tailark`: 动画和特效组件。
- `src/lib`: 工具函数、认证配置、常量。
- `src/db`: Drizzle Schema 定义 (`schema.ts`) 和数据库连接。
- `src/actions`: Server Actions (处理表单提交、数据库操作)。
- `src/config`: 全局配置。
    - `website.tsx`: 网站功能开关、菜单、SEO 配置 (核心配置文件)。
- `content`: MDX 内容 (博客、文档)。
- `messages`: 国际化翻译文件 (`en.json`, `zh.json`)。

## 5. 核心功能配置

核心功能开关位于 `src/config/website.tsx`，可配置项包括：
- **UI 模式**: 暗色/亮色模式。
- **功能开关**: 博客、文档、积分系统 (`enableCredits`)、广告奖励 (`adReward`)、第三方统计等。
- **多语言**: 默认语言设置。
- **支付**: 价格方案 (`free`, `pro`, `lifetime`)。

## 6. 开发规范

- **代码风格**: 遵循 Biome 规范 (运行 `pnpm lint` 检查)。
- **组件命名**: PascalCase。
- **文件命名**: kebab-case。
- **Server Actions**: 优先使用 `src/actions` 中的 Server Actions 处理数据变更，并结合 `next-safe-action` 进行类型安全验证。
- **国际化**: 所有用户可见文本必须在 `messages` 目录下的 JSON 文件中定义，并使用 `useTranslations` 钩子调用。

## 7. 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 (端口 3005) |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 运行生产版本 |
| `pnpm lint` | 代码风格检查与自动修复 (Biome) |
| `pnpm db:generate` | 生成数据库迁移文件 |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:studio` | 启动 Drizzle Studio 数据库管理界面 |
| `pnpm content` | 更新 MDX 内容索引 |
| `pnpm email` | 预览邮件模板 (端口 3333) |

## 8. 资源与文档

- **设计文档**: 查看 `docs/` 目录。
- **迁移记录**: 查看 `001-v0-ui-迁移分析`, `002-迁移功能深入调整` 目录。
- **Agent 说明**: `AGENTS.md` (英文), `CLAUDE.md` (英文)。
