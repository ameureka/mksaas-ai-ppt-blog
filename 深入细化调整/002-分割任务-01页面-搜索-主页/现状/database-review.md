# PPT 数据库状态审查报告 (Database Review)

> **文档状态**: 2025-11-28 已校验
> **数据源**: Neon PostgreSQL (ap-southeast-1)
> **连接方式**: Drizzle ORM / Direct SQL

## 1. 数据库连接与概览

### 1.1 连接信息
- **Host**: `ep-silent-dream-a1w2dlyp-pooler.ap-southeast-1.aws.neon.tech`
- **Database**: `neondb`
- **Protocol**: PostgreSQL (SSL required)

### 1.2 现有表结构
数据库中目前共有 16 张表，涵盖了核心业务 (ppt, user)、支付 (payment, credit)、会话 (session, account) 等模块。

**核心表清单**:
- `ppt`: 核心 PPT 数据表
- `slide`: PPT 对应的幻灯片详情（关联 `ppt.id`）
- `category`: 分类表（独立于 `ppt.category` 字段）
- `user` / `account` / `session`: 用户与鉴权
- `user_credit` / `credit_transaction`: 积分系统
- `download_record` / `view_record`: 统计记录

---

## 2. PPT 表结构深度分析

### 2.1 字段定义
`ppt` 表是本项目的核心，目前包含 20 个字段。

| 字段名 | 类型 | 默认值 | 可空 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | `text` | - | NO | 主键 (PK) |
| **tenant_id** | `text` | - | YES | 多租户 ID |
| **title** | `text` | - | YES | 标题 |
| **author** | `text` | - | YES | 作者 |
| **slides_count** | `integer` | - | YES | 幻灯片页数 |
| **file_url** | `text` | - | YES | PPTX 文件下载链接 |
| **cover_image_url** | `text` | - | YES | 封面图 URL |
| **thumbnail_url** | `text` | - | YES | 缩略图 URL |
| **category** | `text` | - | YES | 分类 Slug (如 `business`) |
| **tags** | `text[]` | - | YES | 标签数组 |
| **language** | `text` | - | YES | 语言 (`zh`, `en`) |
| **status** | `text` | - | YES | 状态 (`draft`, `published`) |
| **visibility** | `text` | - | YES | 可见性 |
| **download_count** | `integer` | - | YES | 下载统计 |
| **view_count** | `integer` | - | YES | 浏览统计 |
| **embedding_id** | `text` | - | YES | 向量数据库 ID (预留) |
| **embedding_model** | `text` | - | YES | 向量模型名称 (预留) |
| **review_status** | `text` | - | YES | 审核状态 |
| **created_at** | `timestamp` | - | YES | 创建时间 |
| **updated_at** | `timestamp` | - | YES | 更新时间 |

### 2.2 索引 (Indexes)
表上已建立完善的索引，支持高效的查询、排序和过滤。

1.  `ppt_pkey`: 主键索引 (Unique)
2.  `ppt_category_idx`: **分类查询**优化
3.  `ppt_status_idx`: **状态过滤**优化
4.  `ppt_language_idx`: **语言过滤**优化
5.  `ppt_created_at_idx`: **最新发布**排序优化 (DESC)
6.  `ppt_download_count_idx`: **下载榜单**排序优化 (DESC)
7.  `ppt_view_count_idx`: **热门榜单**排序优化 (DESC)

### 2.3 触发器 (Triggers)
1.  `ppt_updated_at_trigger`: 每次更新行时自动更新 `updated_at` 字段。
2.  `trigger_category_count`: 插入/删除/更新时自动维护分类计数（关联 `category` 表）。
3.  `RI_ConstraintTrigger_*`: 完整的外键约束触发器（关联 `download_record`, `slide` 等）。

---

## 3. 数据现状与验证

### 3.1 数据量
- **总行数**: 68 条
- **数据状态**: 真实可用，非空壳表。

### 3.2 数据样本 (Top 5)
所有样本数据的 `status` 均为 `published`，`slides_count` 在 20-28 页之间，文件链接指向 `aippt.guochunlin.com`。

| ID (Prefix) | Title | Category | Author | Slides | Created At |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ppt_2c9...` | 文艺复古-135764 | business | 第一PPT | 21 | 2025-11-23 |
| `ppt_829...` | 小清新-135763 | business | 第一PPT | 24 | 2025-11-23 |
| `ppt_d25...` | 小清新-135762 | business | 第一PPT | 25 | 2025-11-23 |
| `ppt_363...` | 新中式-135776 | general | 第一PPT | 20 | 2025-11-23 |
| `ppt_3d3...` | 弥散风-135882 | marketing | 第一PPT | 28 | 2025-11-23 |

---

## 4. 差异分析与行动项

### 4.1 Schema vs. Code 差异
通过对比数据库实际结构与应用层代码，发现以下差异需要注意：

| 差异点 | 数据库现状 | 应用层需求 (Spec) | 影响与建议 |
| :--- | :--- | :--- | :--- |
| **缺少字段** | 无 `description` | DTO 中有 `description` | 前端需做空值兼容，或显示生成的摘要。 |
| **缺少字段** | 无 `file_size` | DTO 中有 `file_size` | 暂时隐藏文件大小展示，或通过 HEAD 请求获取。 |
| **字段类型** | `tags` 是 `text[]` | 部分 DTO 忽略了此字段 | **需修复**: 在 Server Action 中正确映射并返回 `tags`。 |
| **字段忽略** | `language` 存在 | API 未使用 | **需修复**: 将 `language` 加入 API 过滤条件。 |

### 4.2 结论
1.  **数据库就绪**: `ppt` 表结构健康，索引完备，数据量足以支撑开发和测试。
2.  **无需种子**: 现有的 68 条真实数据已足够，无需编写额外的 Seed 脚本。
3.  **开发重点**: 接下来的工作应集中在 **Application Layer** (Server Actions)，使其充分利用数据库已有的字段（特别是 `tags`, `language`）和索引能力。

---