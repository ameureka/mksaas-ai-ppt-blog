# MkSaaS 项目文档导航

欢迎查阅 MkSaaS 项目的完整文档。本文档库经过系统化整理，包含架构设计、数据库文档、功能模块、开发指南等内容。

## 📋 文档准确性评估

根据 2026-01-02 的文档重组，所有文档已迁移至新的目录结构并更新链接引用。

## 🗂️ 文档目录结构

### 00 快速开始
快速入门指南和基础配置。

📁 **位置**: `docs/00-getting-started/`

| 文档 | 说明 |
|------|------|
| [README](./00-getting-started/README.md) | 快速开始导航 |
| [常用命令](./00-getting-started/常用命令.md) | 开发常用命令速查 |
| [开发流程](./00-getting-started/开发流程.md) | 标准开发工作流 |
| [最小化配置指南](./00-getting-started/最小化配置指南.md) | 最简配置启动项目 |
| [Google OAuth 配置](./00-getting-started/Google-OAuth-配置指南.md) | OAuth 认证配置 |
| [积分系统指南](./00-getting-started/积分系统指南.md) | 积分功能配置 |
| [管理界面指南](./00-getting-started/管理界面和组件指南.md) | 管理后台使用 |
| [FAQ](./00-getting-started/FAQ.md) | 常见问题解答 |

### 01 架构与设计
系统架构分析、设计文档和项目分析报告。

📁 **位置**: `docs/01-architecture/`

| 文档 | 说明 |
|------|------|
| [架构图](./01-architecture/ARCHITECTURE_DIAGRAM.md) | 系统架构可视化图表 |
| [项目分析报告](./01-architecture/PROJECT_ANALYSIS_REPORT.md) | 完整的项目分析 |
| [分析索引](./01-architecture/ANALYSIS_INDEX.md) | 分析文档导航 |
| [分析摘要](./01-architecture/ANALYSIS_SUMMARY.md) | 快速了解项目概况 |
| [五层架构详解](./01-architecture/五层架构详解.md) | 架构分层说明 |
| [设计思想和模式](./01-architecture/设计思想和模式.md) | 设计模式解析 |
| [概念澄清](./01-architecture/概念澄清.md) | 术语和概念说明 |

**子目录**:
- `diagrams/` - 架构图、流程图、页面布局图
- `components/` - 组件文档 (DiceUI DataTable 等)

### 02 核心概念
数据库架构、ORM 使用、核心技术概念。

📁 **位置**: `docs/02-concepts/`

| 文档 | 说明 |
|------|------|
| [数据库架构分析](./02-concepts/DATABASE_ARCHITECTURE_ANALYSIS.md) | 完整的数据库架构分析 |
| [数据库分析说明](./02-concepts/DB_ANALYSIS_README.md) | 数据库文档导航 |
| [数据库快速参考](./02-concepts/DB_QUICK_REFERENCE.md) | 快速查询表结构和关系 |
| [数据库迁移演进](./02-concepts/DB_MIGRATION_EVOLUTION.md) | 迁移历史记录 |
| [数据库设计深度讲解](./02-concepts/数据库设计深度讲解.md) | 数据库设计详解 |
| [用户认证深度解析](./02-concepts/用户认证深度解析.md) | 认证系统原理 |
| [支付系统详解](./02-concepts/支付系统详解.md) | 支付流程解析 |
| [国际化实现](./02-concepts/国际化实现.md) | i18n 实现方案 |

### 03 开发指南
开发流程、编码规范、最佳实践。

📁 **位置**: `docs/03-guides/`

| 文档 | 说明 |
|------|------|
| [组件设计指南](./03-guides/组件设计指南.md) | 组件开发规范 |
| [自定义 Hooks](./03-guides/自定义Hooks.md) | Hook 开发指南 |
| [API Routes 详解](./03-guides/API%20Routes详解.md) | API 路由开发 |
| [Server Actions 详解](./03-guides/Server%20Actions详解.md) | Server Actions 使用 |
| [页面设计指南](./03-guides/页面设计指南.md) | 页面开发规范 |
| [表单处理完全指南](./03-guides/表单处理完全指南.md) | 表单开发指南 |

### 04 功能模块
各个功能模块的详细说明。

📁 **位置**: `docs/04-modules/`

**支付与积分系统** (`payment/`):
| 文档 | 说明 |
|------|------|
| [支付系统总览](./04-modules/payment/overview.md) | 支付系统核心文档 |
| [支付积分完整分析](./04-modules/payment/analysis.md) | 深入分析支付和积分系统 |
| [支付积分流程图](./04-modules/payment/diagrams.md) | 可视化流程和数据流 |
| [支付积分快速参考](./04-modules/payment/quick-reference.md) | 快速查询 API 和配置 |

**其他模块**:
| 模块 | 文档 | 说明 |
|------|------|------|
| PPT 模板 | [overview.md](./04-modules/ppt/overview.md) | PPT 模板管理系统 |
| 广告系统 | [overview.md](./04-modules/ads/overview.md) | 激励广告系统 |
| 搜索系统 | [overview.md](./04-modules/search/overview.md) | 搜索和热词管理 |
| 邮件系统 | [email.md](./04-modules/communication/email.md) | Email 发送模块 |
| 邮件订阅 | [newsletter.md](./04-modules/communication/newsletter.md) | Newsletter 订阅 |
| 存储方案 | [overview.md](./04-modules/storage/overview.md) | S3 兼容存储 |

### 05 参考文档
API 参考、配置说明、部署指南。

📁 **位置**: `docs/05-reference/`

**部署与运维** (`deployment/`):
| 文档 | 说明 |
|------|------|
| [部署指南](./05-reference/deployment/guide.md) | 完整部署流程 |
| [环境变量参考](./05-reference/deployment/env-vars.md) | 环境变量配置说明 |
| [故障排除](./05-reference/deployment/troubleshooting.md) | 常见问题解决方案 |

**集成与开发** (`integrations/`, `v0-design/`):
| 文档 | 说明 |
|------|------|
| [Stripe 集成详解](./05-reference/integrations/stripe.md) | 详细的 Stripe 集成指南 |
| [v0 设计系统指南](./05-reference/v0-design/alignment-guide.md) | UI/UX 设计规范 |
| [v0 组件文档](./05-reference/v0-design/components.md) | v0 组件说明 |
| [v0 导入清单](./05-reference/v0-design/import-checklist.md) | 组件导入检查 |

**通用参考**:
| 文档 | 说明 |
|------|------|
| [快速参考手册](./05-reference/QUICK_REFERENCE.md) | 项目快速参考 |
| [Agent 指南](./05-reference/AGENTS.md) | AI Agent 相关文档 |
| [API 参考文档](./05-reference/API参考文档.md) | API 接口说明 |

### 06 QA 问答库
技术问答、业务问答、方法论文档。

📁 **位置**: `docs/06-qa/`

| 子目录 | 说明 | 文件数 |
|--------|------|--------|
| `technical/` | 技术架构、数据库、部署相关问答 | ~15 |
| `business/` | 收益模式、支付、SEO、用户故事 | ~8 |
| `methodology/` | QA 方法论、快速入门、总结 | 3 |
| `validation/` | 验证计划和日志 | 2 |

**快速入口**:
- [QA 快速入门](./06-qa/methodology/QA-QUICK-START.md)
- [QA 方法论](./06-qa/methodology/QA-METHODOLOGY.md)

### 07 项目报告
项目状态报告、完成报告、质量验证。

📁 **位置**: `docs/07-reports/`

| 文档 | 说明 |
|------|------|
| [完成报告](./07-reports/COMPLETION_REPORT.md) | 功能完成情况 |
| [质量验证报告](./07-reports/QUALITY_VALIDATION_REPORT.md) | 代码质量审查结果 |
| [AdSense 准备状态](./07-reports/adsense-readiness.md) | AdSense 审核报告 |
| [检查点](./07-reports/CHECKPOINT.md) | 开发检查点记录 |
| [Playwright 截图计划](./07-reports/PLAYWRIGHT_SCREENSHOT_PLAN.md) | 自动化测试截图计划 |

**历史归档**: `archive/` - 过往项目状态报告

### 08 开发笔记
v0 原型开发相关文档、页面激活计划、设计模板。

📁 **位置**: `docs/08-dev-notes/`

| 文档 | 说明 |
|------|------|
| 项目现状分析 | 开发进度分析 |
| PPT 功能页面分析 | PPT 模块激活计划 |
| 页面预览激活计划 | Mock 优先策略 |
| 阶段执行总结报告 | 开发阶段总结 |

**v0 模板** (`v0-templates/`): v0 开发规范和集成指南

---

## 📚 其他文档资源

### 根目录核心文档
- [README.md](../README.md) - 项目主说明文档
- [CLAUDE.md](../CLAUDE.md) - Claude Code 工作指导

---

## 🎯 推荐阅读路径

### 新手入门（第 1 天）
1. 阅读根目录 `README.md`
2. 查看 `docs/00-getting-started/`
3. 浏览 `docs/01-architecture/ANALYSIS_SUMMARY.md`

### 深入理解（第 2-3 天）
1. 阅读 `docs/01-architecture/PROJECT_ANALYSIS_REPORT.md`
2. 学习 `docs/02-concepts/` 中的数据库文档
3. 了解 `docs/04-modules/` 中的支付和积分系统

### 开发实战（第 4-5 天）
1. 参考 `docs/03-guides/`
2. 查阅 `docs/05-reference/QUICK_REFERENCE.md`
3. 根据需要查看 `docs/06-qa/` 中的相关问答

---

## 🔍 文档搜索技巧

1. **按主题查找**: 使用目录结构快速定位相关文档
2. **快速参考**: 查看 `QUICK_REFERENCE.md` 和各个 `quick-reference.md` 文件
3. **深入分析**: 查看 `*_ANALYSIS.md` 文件获取详细信息
4. **流程图表**: 查看 `diagrams/` 目录了解可视化内容

---

## 📝 文档维护

**最后重组**: 2026-01-02

**目录结构变更**:
- 统一使用英文目录名和数字前缀 (00-08)
- QA 文档按类型分类 (technical/business/methodology)
- 报告和计划合并至 07-reports
- 架构图和组件文档移入 01-architecture

**文档准确性**: 95%+
**验证状态**: 已通过结构验证

---

**提示**: 建议从"推荐阅读路径"开始，根据您的角色（新手/开发者/架构师）选择合适的文档顺序。
