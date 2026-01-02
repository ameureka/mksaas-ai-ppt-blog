# PPT 模板管理系统

PPT 模板市场功能模块，支持模板浏览、搜索、下载和管理。

## 模块结构

### 数据库表

| 表名 | 用途 |
|------|------|
| `ppt` | PPT 模板核心表，含向量搜索 |
| `adWatchRecord` | 广告观看记录 |
| `userDownloadHistory` | 下载历史 |
| `searchLog` | 搜索日志 |
| `hotKeywords` | 热门关键词 |
| `pinnedKeywords` | 置顶关键词 |

### API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/ppts` | GET | 获取模板列表 |
| `/api/ppts/[id]` | GET | 获取模板详情 |
| `/api/ppts/[id]/download` | GET | 下载模板 |
| `/api/ppts/[id]/download-status` | GET | 检查下载状态 |
| `/api/ppts/[id]/view` | POST | 记录浏览 |
| `/api/ppts/featured` | GET | 精选模板 |
| `/api/ppts/stats` | GET | 统计数据 |

### Server Actions

位置: `src/actions/ppt/`

- `ppt.ts` - CRUD 操作
- `stats.ts` - 统计查询
- `user.ts` - 用户相关操作

### 前端组件

位置: `src/components/ppt/`

```
ppt/
├── ppt-card.tsx           # 模板卡片
├── search-filters.tsx     # 搜索过滤器
├── search-sidebar.tsx     # 侧边栏过滤
├── navigation-header.tsx  # 导航头部
├── download/              # 下载流程
├── ads/                   # 广告组件
├── auth/                  # 认证弹窗
└── admin/                 # 管理组件
```

### 页面路由

**营销页面** (`/[locale]/(marketing)/ppt/`):
- `/ppt` - 模板列表
- `/ppt/[id]` - 模板详情
- `/ppt/categories` - 分类概览
- `/ppt/category/[name]` - 分类页面

**管理页面** (`/[locale]/(protected)/admin/`):
- `/admin/ppt/list` - 模板管理
- `/admin/ppt/list/[id]/edit` - 编辑模板
- `/admin/stats` - 统计仪表板

### Hooks

位置: `src/hooks/ppt/`

| Hook | 用途 |
|------|------|
| `use-get-ppts` | 获取模板列表 |
| `use-get-ppt` | 获取单个模板 |
| `use-create-ppt` | 创建模板 (管理员) |
| `use-update-ppt` | 更新模板 (管理员) |
| `use-delete-ppt` | 删除模板 (管理员) |

## 核心功能

### 1. 模板搜索

支持多种搜索方式:
- SQL 关键词搜索
- 向量语义搜索 (pgvector 1024维)
- 混合搜索 (Hybrid)

### 2. 下载方式

| 方式 | 说明 |
|------|------|
| `firstFree` | 首次免费下载 |
| `credits` | 积分下载 |
| `ad` | 观看广告下载 |

### 3. 向量嵌入

- 使用 pgvector 扩展
- 1024 维向量存储
- 状态: `pending` / `success` / `failed`
- 定时修复: `/api/cron/repair-embeddings`

## 数据库 Schema

```sql
-- ppt 表核心字段
id              TEXT PRIMARY KEY
title           TEXT NOT NULL
author          TEXT
category        TEXT
tags            TEXT[]           -- 标签数组
status          TEXT            -- draft, published, archived
file_url        TEXT NOT NULL
cover_image_url TEXT
thumbnail_url   TEXT
download_count  INTEGER
view_count      INTEGER
embedding       VECTOR(1024)    -- pgvector
embedding_status TEXT           -- pending, success, failed
deleted_at      TIMESTAMP       -- 软删除
```

## 相关文档

- [数据库快速参考](../../02-concepts/DB_QUICK_REFERENCE.md)
- [API 参考文档](../../05-reference/API参考文档.md)

---

**最后更新:** 2026-01-02
