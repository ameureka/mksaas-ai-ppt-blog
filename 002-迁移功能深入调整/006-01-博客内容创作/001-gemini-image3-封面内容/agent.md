# Gemini 封面生成方案 - Agent 学习总结

> 更新时间：2025-12-06
> 状态：✅ 已实现 (优化版 v2.0)

---

## 📋 核心目标

为 100 篇博文批量生成（默认仅封面，可选开启内页）：
- **封面图**：1200x630，含短标题或留白，<200KB
- **内页配图**（可选）：3 张/篇，1000x600，情景化，<150KB

---

## 🏗️ 四阶段流水线架构

```
Phase 1: Prompt 生成（✅ 已实现）
   MDX 文件 → 内容分析 (Content-Aware) → image-tasks.json + pending-prompts.md

Phase 2: 图片生成（手工执行）
   Gemini 网页 → 复制 Prompt → 生成 → 下载命名

Phase 3: 后处理（待实现）
   压缩 → 命名规范化 → 状态更新

Phase 4: 同步部署（待实现）
   本地存储 → S3/CDN 上传 → MDX frontmatter 更新
```

---

## ✅ 已实现功能 (优化版 v2.0)

| 功能 | 文件 | 说明 |
|------|------|------|
| **统一分类配置** | `category-config.ts` | **单一事实来源**，合并了旧的 map 和 styles，修复了字段缺失 |
| **自动分类映射** | `generate-prompts.ts` | 根据**文件所在子目录**自动映射到正确的分类 (Schema-B) |
| **Slug 自动英化** | `generate-prompts.ts` | 自动将中文文件名转换为 SEO 友好的英文 slug |
| **Content-Aware** | `prompt-templates.ts` | 增强的内容感知，从 H2 和段落提取视觉元素 |
| **Prompt 模板** | `prompt-templates.ts` | 更新为使用 `CategoryConfig` 接口 |
| **清单导出** | `export-pending.ts` | 导出优化的 Prompt 清单 |

---

## 📊 数据统计 (2025-12-06 最新)

| 指标 | 数值 |
|------|------|
| 文章总数 | 100 篇（来自 `广告-博文` 目录） |
| 封面图 | 100 张（默认生成） |
| 内页图 | 0 张（本次配置为 cover-only 模式） |
| 总计 | 100 张 |
| 分类数 | 8 个 |

---

## 🎨 分类风格速查 (Category Config)

| 英文 Slug | 中文名称 | 配色方案 | 核心风格 | 封面关键词 |
| :--- | :--- | :--- | :--- | :--- |
| **`business`** | **商务汇报** | 深蓝/灰/白 | 极简网格、数据卡片 | 商务汇报, 工作汇报 |
| **`education`** | **教育培训** | 绿/蓝/黄 | 明快高对比、插画 | 教育培训, 课件 |
| **`general`** | **通用技巧** | 蓝/绿/黄 | 多功能、实用 | PPT技巧, 制作指南 |
| **`marketing`** | **产品营销** | 粉/紫/青 | 高对比、渐变霓虹 | 产品营销, 营销方案 |
| **`paid-search`** | **付费搜索** | 紫/粉/青 | 现代、资源导向 | 模板搜索, 付费模板 |
| **`year-end`** | **年终总结** | 暖橙/金/米 | 时间线、稳重 | 年终总结, 年度复盘 |
| **`proposal`** | **项目提案** | 蓝/绿/白 | 创新、技术感 | 项目提案, BP, 路演 |
| **`report`** | **述职报告** | 深灰/石墨/白 | 专业、稳重 | 述职报告, 晋升汇报 |

---

## ⚠️ 中文文字渲染策略

| 策略 | 做法 | 适用场景 |
|------|------|----------|
| short-zh | 只渲染 4-6 字短标题 | 默认，成功率高 |
| english | 用英文标题 | 英文版封面 |
| blank | 留白不渲染文字 | 后期叠加 |

---

## 🚀 使用流程

### 1. 生成 Prompt

```bash
cd draft-code
# 1. 生成任务数据 (自动扫描目录、映射分类、转换Slug)
npx tsx scripts/image-pipeline/generate-prompts.ts

# 2. 导出 Markdown 清单
npx tsx scripts/image-pipeline/export-pending.ts
```

### 2. 手工生成图片

1. 打开 `draft-code/data/pending-prompts.md`
2. 复制 Prompt → 粘贴到 Gemini
3. 下载图片 → 按清单指定的**英文文件名**重命名
4. 保存到 `draft-code/generated-images/{category}/`

### 3. 后处理（待执行）

```bash
# 压缩
# 复制到 public/images/blog/
# 更新 MDX frontmatter
# 上传 S3
```

---

## 📁 文件结构

```
draft-code/
├── config/
│   ├── category-config.ts      # ✅ 统一分类配置 (Single Source of Truth)
│   └── prompt-templates.ts     # ✅ 适配新配置的模板
├── scripts/image-pipeline/
│   ├── generate-prompts.ts     # ✅ 增强版生成脚本 (目录映射+Slug转换)
│   ├── export-pending.ts       # 导出清单
│   └── types.ts                # 类型定义
├── data/
│   ├── image-tasks.json        # 任务数据
│   └── pending-prompts.md      # 待处理清单
└── generated-images/           # (图片存放处)
```