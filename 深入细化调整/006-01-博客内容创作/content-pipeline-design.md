# 博客内容批量生产流水线设计方案 (Content Pipeline Design)

> **文档状态**: 2025-11-28 草案
> **执行引擎**: Gemini CLI (Gemini 3)
> **核心策略**: 中文优先 -> 交互式批处理 -> 双语发布

## 1. 流水线架构概览

本流水线旨在利用 Gemini CLI 的强大能力，将标准化的选题转化为高质量、SEO 友好且符合 GEO (Generative Engine Optimization) 标准的 MDX 博客文章。

### 1.1 工作流 (Workflow)

```mermaid
graph TD
    A[选题池构建 (Topic DB)] --> B{Gemini CLI};
    B --> C[批量生成大纲 (Outline)];
    C -- 人工审核/微调 --> D[批量生成正文 (Content)];
    D --> E[组件与图片占位 (Assets)];
    E --> F[中文 MDX 成品];
    F --> G[AI 翻译 (Translation)];
    G --> H[英文 MDX 成品];
    H --> I[发布 (Publish)];
```

---

## 2. 阶段一：选题池构建 (Topic Database)

我们不依赖散乱的文本文件，而是建立一个结构化的 JSON 选题库，作为流水线的“输入源”。

### 2.1 数据结构 (`topics.json`)

```json
[
  {
    "id": "business-report-guide",
    "category": "business",  // 对应 content/category/business.mdx
    "keywords": ["商务汇报PPT", "工作汇报结构", "PPT制作技巧"],
    "title_idea": "商务汇报PPT怎么做？从结构到演讲的完整指南",
    "user_intent": "用户需要做一个下周要用的汇报PPT，很焦虑，不知道放什么内容。",
    "tone": "Professional, Encouraging", // 专业且鼓励
    "status": "pending" // pending -> outlined -> drafted -> completed
  }
]
```

---

## 3. 阶段二：分步生成策略 (Gemini Interaction)

我们将利用 Gemini CLI 的对话能力，分两步完成生成，确保质量可控。

### 3.1 步骤 A：生成大纲 (Outline Generation)

**Input**: 选题 JSON 对象。
**Prompt 目标**: 生成包含 H2, H3 标题和每个章节核心论点的结构。

**Prompt 模板**:
```markdown
你是一个专业的 PPT 设计顾问和 SEO 内容专家。
请为以下选题设计一个详细的文章大纲：
- 标题: {title_idea}
- 核心关键词: {keywords}
- 目标受众痛点: {user_intent}

要求：
1. 结构符合 "提出问题 -> 分析原因 -> 解决方案 -> 实战技巧 -> 模板推荐" 的逻辑。
2. 包含至少 5 个 H2 标题。
3. 在合适的位置设计 "权威引用" (如麦肯锡、哈佛商业评论的数据) 占位符。
4. 输出格式为 Markdown 列表。
```

### 3.2 步骤 B：生成正文 (Content Generation)

**Input**: 确认后的大纲。
**Prompt 目标**: 生成完整的 MDX 内容。

**Prompt 模板**:
```markdown
请基于上述大纲，撰写完整的博客文章。

技术规范：
1. **格式**: 使用 MDX 格式。
2. **Frontmatter**: 包含 title, description, date (today), image (占位), published: true, premium: false, categories, author: "pptx-team"。
3. **组件使用**: 
   - 关键提示使用 `<Callout type="tip">内容</Callout>`。
   - 警告信息使用 `<Callout type="warn">内容</Callout>`。
4. **SEO/GEO 优化**:
   - 正文自然融入关键词。
   - 必须包含 "权威数据引用" (即使是模拟的，也要看起来真实，例如 "根据 2024 年职场报告...")。
   - 语言简洁有力，适合 AI 搜索提取摘要。
5. **图片占位**: 使用 `![描述](/images/blog/{slug}-{index}.png)` 格式。
```

---

## 4. 阶段三：多语言翻译 (Translation)

**Input**: 中文 MDX 文件内容。
**Prompt 目标**: 翻译为英文，保留 MDX 结构和 Frontmatter 变量名。

**Prompt 模板**:
```markdown
将以下 MDX 内容翻译为英文：

要求：
1. **保留 Frontmatter 结构**，但翻译 title 和 description 的值。
2. **保留组件代码** (如 <Callout>) 不变，只翻译组件内的文本。
3. **保留图片路径** 不变。
4. 语言风格：Native American English，专业、商务。
5. 输出文件名建议: {slug}.mdx (原文件为 {slug}.zh.mdx)。
```

---

## 5. 工程化支持 (Scripting)

为了支撑 Gemini CLI 高效工作，我们需要准备一些辅助脚本或命令别名。

### 5.1 `gen-blog` 伪指令
在 Gemini CLI 中，我们可以定义一个 `system prompt` 或者 `persona` 来固化上述 Prompt。

**Persona 定义 (System Prompt)**:
> 你是 MkSaaS 博客的内容生产引擎。你的任务是读取我提供的选题 JSON，按步骤生成高质量的 PPT 教程文章。你必须严格遵守 MDX 格式规范，并擅长使用权威数据来增强文章的可信度。

---

## 6. 下一步行动

1.  **建立选题库**: 从 `/广告-博文` 目录中提取 10 个高优先级选题，填入 `topics.json`。
2.  **测试生产**: 选取 1 个选题，跑通 "大纲 -> 正文 -> 翻译" 全流程，验证质量。
3.  **批量执行**: 验证无误后，批量生成剩余 9 篇。
