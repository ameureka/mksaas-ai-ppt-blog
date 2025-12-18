# PPT 模板元数据生成任务

## 输入信息

- **标题**: {title}
- **频道**: {channel_name}
- **原始标签**: {original_tags}

## PPT 全文内容

{extracted_text}

## 任务要求

你是一个专业的 PPT 资源整理专家。请根据以上信息，输出以下 JSON 格式的元数据。

**重要约束**：
- 请勿包含任何无关的英文占位符（如 Lorem ipsum、Click to add）
- 请勿包含来源网站信息（如 1ppt、第一PPT、www.1ppt.com）
- 所有中文描述应简洁专业
- 关键词应具有搜索价值，避免过于宽泛或重复

## 输出格式（JSON）

```json
{
  "ai_summary": "200字以内的中文介绍，描述风格、配色、元素和适用场景",
  "ai_keywords": ["5-10个中文关键词，用于SEO"],
  "ai_scenario": "适合的具体使用场景，如'互联网路演'、'科技发布会'",
  "ai_color_scheme": "推测的主要配色，如'黑金'、'蓝紫'",
  "ai_structure_features": "模板内部结构特点，如'包含封面、目录、正文、总结章节'",
  "ai_template_features": "模板独特编辑特点，如'全矢量可编辑'、'统一配色与字体'",
  "ppthub_category": "分类slug，必须为以下之一：business/education/technology/design/marketing/hr/medical/finance/general/summary/report/plan",
  "language": "主要语言，必须为：中文/English/其他"
}
```

请仅输出 JSON，不要包含其他内容。
