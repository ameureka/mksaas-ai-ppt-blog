# MkSaaS 项目文档导航

欢迎查阅 MkSaaS 项目的完整文档。本文档库经过系统化整理，包含架构设计、数据库文档、功能模块、开发指南等内容。

## 📋 文档准确性评估

根据 2025-11-18 的代码审查，所有文档的整体准确性达到 **95%**，与实际项目代码高度一致。

## 🗂️ 文档目录结构

### 0️⃣ 快速开始
快速入门指南和基础配置。

📁 **位置**: `docs/0-快速开始/`

### 1️⃣ 架构与设计
系统架构分析、设计文档和项目分析报告。

📁 **位置**: `docs/1-架构与设计/`

**核心文档**:
- [架构图](./1-架构与设计/ARCHITECTURE_DIAGRAM.md) - 系统架构可视化图表
- [项目分析报告](./1-架构与设计/PROJECT_ANALYSIS_REPORT.md) - 完整的项目分析
- [分析索引](./1-架构与设计/ANALYSIS_INDEX.md) - 分析文档导航
- [分析摘要](./1-架构与设计/ANALYSIS_SUMMARY.md) - 快速了解项目概况

### 2️⃣ 核心概念
数据库架构、ORM 使用、核心技术概念。

📁 **位置**: `docs/2-核心概念/`

**数据库文档**:
- [数据库架构分析](./2-核心概念/DATABASE_ARCHITECTURE_ANALYSIS.md) - 完整的数据库架构分析
- [数据库分析说明](./2-核心概念/DB_ANALYSIS_README.md) - 数据库文档导航
- [数据库快速参考](./2-核心概念/DB_QUICK_REFERENCE.md) - 快速查询表结构和关系
- [数据库迁移演进](./2-核心概念/DB_MIGRATION_EVOLUTION.md) - 迁移历史记录

### 3️⃣ 开发指南
开发流程、编码规范、最佳实践。

📁 **位置**: `docs/3-开发指南/`

### 4️⃣ 功能模块
各个功能模块的详细说明。

📁 **位置**: `docs/4-功能模块/`

**支付与积分系统**:
- [支付积分完整分析](./4-功能模块/PAYMENT_CREDITS_ANALYSIS.md) - 深入分析支付和积分系统
- [支付积分流程图](./4-功能模块/PAYMENT_CREDITS_DIAGRAMS.md) - 可视化流程和数据流
- [支付积分快速参考](./4-功能模块/PAYMENT_CREDITS_QUICK_REFERENCE.md) - 快速查询 API 和配置

### 6️⃣ 参考文档和部署指南
API 参考、配置说明、部署指南。

📁 **位置**: `docs/6-参考文档和部署指南/`

**核心参考**:
- [快速参考手册](./6-参考文档和部署指南/QUICK_REFERENCE.md) - 项目快速参考
- [Agent 指南](./6-参考文档和部署指南/AGENTS.md) - AI Agent 相关文档

### 📊 项目报告
项目状态报告、完成报告、质量验证。

📁 **位置**: `docs/reports/`

**报告文档**:
- [项目状态 2025-11-18](./reports/PROJECT_STATUS_2025_11_18.md) - 最新项目状态
- [完成报告](./reports/COMPLETION_REPORT.md) - 功能完成情况
- [质量验证报告](./reports/QUALITY_VALIDATION_REPORT.md) - 代码质量审查结果
- [检查点](./reports/CHECKPOINT.md) - 开发检查点记录

### 📅 计划文档
未来计划、测试计划、改进方案。

📁 **位置**: `docs/plans/`

**计划文档**:
- [Playwright 截图计划](./plans/PLAYWRIGHT_SCREENSHOT_PLAN.md) - 自动化测试截图计划

## 📚 其他文档资源

### 根目录核心文档
- [README.md](../README.md) - 项目主说明文档
- [CLAUDE.md](../CLAUDE.md) - Claude Code 工作指导

### QA 目录
📁 **位置**: `QA/`

包含20个问答文档，涵盖技术选型、架构设计、部署策略等各个方面。

### 功能模块专项文档
📁 **位置**: `docs/`

- [EMAIL.md](./EMAIL.md) - 邮件系统说明
- [NEWSLETTER.md](./NEWSLETTER.md) - 邮件订阅系统
- [PAYMENT.md](./PAYMENT.md) - 支付系统详细说明
- [STORAGE.md](./STORAGE.md) - 存储方案
- [STRIPE.md](./STRIPE.md) - Stripe 集成详解

## 🎯 推荐阅读路径

### 新手入门（第1天）
1. 阅读根目录 `README.md`
2. 查看 `docs/0-快速开始/`
3. 浏览 `docs/1-架构与设计/ANALYSIS_SUMMARY.md`

### 深入理解（第2-3天）
1. 阅读 `docs/1-架构与设计/PROJECT_ANALYSIS_REPORT.md`
2. 学习 `docs/2-核心概念/` 中的数据库文档
3. 了解 `docs/4-功能模块/` 中的支付和积分系统

### 开发实战（第4-5天）
1. 参考 `docs/3-开发指南/`
2. 查阅 `docs/6-参考文档和部署指南/QUICK_REFERENCE.md`
3. 根据需要查看 `QA/` 中的相关问答

## 🔍 文档搜索技巧

1. **按主题查找**: 使用目录结构快速定位相关文档
2. **快速参考**: 查看 `QUICK_REFERENCE.md` 和各个 `*_QUICK_REFERENCE.md` 文件
3. **深入分析**: 查看 `*_ANALYSIS.md` 文件获取详细信息
4. **流程图表**: 查看 `*_DIAGRAMS.md` 或 `ARCHITECTURE_DIAGRAM.md` 了解可视化内容

## 📝 文档维护

所有文档经过以下验证（2025-11-18）:
- ✅ 与实际代码对比验证
- ✅ 数据库结构准确性检查
- ✅ 功能实现状态确认
- ✅ 代码行数和文件路径验证

**文档准确性**: 95%
**最后更新**: 2025-11-18
**验证状态**: 已通过代码审查

## 🤝 贡献指南

如果发现文档不准确或需要更新，请：
1. 在相关文档中添加注释
2. 提交 Issue 说明问题
3. 提供 PR 更新文档

---

**提示**: 建议从"推荐阅读路径"开始，根据您的角色（新手/开发者/架构师）选择合适的文档顺序。
