# 博客内容生成 Prompt 模板

> **使用说明**: 请将 `{变量}` 替换为 `topics.json` 中的实际值，然后发送给 Gemini。

---

## 1. 阶段 A：生成大纲 (Outline)

**Input Prompt:**

```markdown
Role: You are a Senior PPT Design Consultant and SEO Content Strategist.
Task: Create a detailed article outline for a blog post.

Context:
- **Title Idea**: "{title_idea}"
- **Target Keywords**: {keywords}
- **User Intent**: "{intent}"
- **Category**: {category}

Requirements:
1. **Structure**: Follow a logical flow: "Problem/Pain Point -> Core Concept/Solution -> Step-by-Step Guide -> Best Practices/Examples -> Template Recommendation".
2. **Headings**: Include at least 5-7 H2 headings. Use H3 for subsections.
3. **Authority**: Explicitly mark 2-3 places in the outline where you will insert "Authoritative Data/Quotes" (e.g., [Insert data from McKinsey/Harvard/Industry Report]).
4. **Engagement**: Include a "FAQ" section at the end.
5. **Language**: Chinese (Simplified).

Output Format: Markdown list.
```

---

## 2. 阶段 B：生成正文 (Content)

**Input Prompt:**

```markdown
Role: You are a Professional Tech Writer specializing in PPT and Design.
Task: Write the full blog post based on the outline above.

Technical Specifications (Strictly Follow):
1. **Format**: MDX (Markdown + JSX).
2. **Frontmatter**:
   ```yaml
   ---
   title: "{title_idea}"
   description: "Write a compelling SEO description (150 chars) including keywords: {keywords}"
   image: /images/blog/{id}-cover.jpg
   date: "2025-11-28"
   published: true
   premium: false
   categories: ["{category}"]
   author: "pptx-team"
   ---
   ```
3. **Components**:
   - Use `<Callout type="tip">Tip content</Callout>` for pro tips.
   - Use `<Callout type="warn">Warning content</Callout>` for common mistakes.
   - Use `<Callout type="info">Info content</Callout>` for external references.
4. **Content Quality**:
   - **GEO Optimization**: You MUST invent/cite plausible authoritative statistics to support arguments (e.g., "According to 2024 workplace survey, 78% of...").
   - **Tone**: Professional, helpful, encouraging, and concise.
   - **Length**: 1500-2000 words.
5. **Image Placeholders**:
   - Insert `![Image Description](/images/blog/{id}-{index}.png)` at logical breaks (at least 3 images).

Action: Write the full MDX content now in Chinese.
```

---

## 3. 阶段 C：多语言翻译 (Translation)

**Input Prompt:**

```markdown
Role: Expert Translator (Chinese to English).
Task: Translate the following MDX content into Native American English.

Constraints:
1. **Frontmatter**:
   - Translate `title` and `description`.
   - KEEP `date`, `image`, `published`, `premium`, `categories`, `author` UNCHANGED.
   - `categories` values should map to English slugs (e.g., "商务汇报" -> "business").
2. **Components**:
   - KEEP structure `<Callout ...>...</Callout>` exactly as is.
   - Only translate the text content *inside* the tags.
3. **Images**:
   - KEEP all image paths `![...](...)` EXACTLY as is.
4. **Tone**: Business professional, native, fluent.

Content to Translate:
[Paste Chinese MDX Here]
```
