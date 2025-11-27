# mk-saas-blog 博客集成方案

## 背景

当前 PPT 下载站项目未来将集成到 mk-saas 平台中。为了确保平滑迁移，我们采用"内容优先"策略：现在按 mk-saas 格式准备博客内容，未来可直接迁移。

## 集成策略：内容优先（路径 1）

### 为什么选择这个方案？

1. **避免重复工作** - 未来合并到 mk-saas 时，不会有代码冲突
2. **专注内容创作** - AdSense 申请最重要的是高质量内容
3. **迁移成本低** - MDX 文件是纯内容，直接复制即可

### 具体做法

1. 创建 `content/blog` 目录，按 mk-saas 格式写 MDX 文章
2. 创建 `content/author` 和 `content/category` 目录
3. 当前博客页面保持简单实现（或临时隐藏）
4. 未来集成 mk-saas 时，内容直接可用

---

## MDX 文章格式规范

### 什么是 MDX？

MDX = Markdown + JSX，比普通 Markdown 更强大：

- **Frontmatter 元数据** - SEO 必需的 title、description、image 等
- **可嵌入 React 组件** - 视频播放器、提示框、CTA 按钮等
- **类型安全** - Zod schema 验证确保数据完整性

### MDX 文章示例

```mdx
---
title: 如何下载免费PPT模板
description: 完整指南教你快速下载高质量PPT模板
image: /images/blog/download-guide.jpg
date: "2024-01-15"
published: true
categories: ["tutorial", "ppt"]
author: "pptx-team"
---

# 引言

这是普通 Markdown 内容...

## 特色功能

{/* 可以嵌入 React 组件 */}
<Callout type="tip">
  这是一个提示框组件
</Callout>

<VideoPlayer src="/videos/demo.mp4" />

{/* 可以写 JavaScript 表达式 */}
当前年份：{new Date().getFullYear()}
```

### Frontmatter 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 文章标题，包含主关键词 |
| description | string | ✅ | SEO 描述，155 字符内 |
| image | string | ✅ | 封面图路径 |
| date | string | ✅ | 发布日期，格式 "YYYY-MM-DD" |
| published | boolean | ❌ | 是否发布，默认 true |
| categories | string[] | ✅ | 分类数组 |
| author | string | ✅ | 作者 slug |

---

## 目录结构

```
project-root/
├── content/
│   ├── blog/                    # 博客文章
│   │   ├── download-guide.mdx       # 英文版
│   │   ├── download-guide.zh.mdx    # 中文版
│   │   ├── ppt-design-tips.mdx
│   │   └── ppt-design-tips.zh.mdx
│   ├── author/                  # 作者信息
│   │   ├── pptx-team.mdx
│   │   └── pptx-team.zh.mdx
│   └── category/                # 分类信息
│       ├── tutorial.mdx
│       ├── tutorial.zh.mdx
│       ├── tips.mdx
│       └── tips.zh.mdx
├── public/
│   └── images/
│       ├── blog/                # 博客封面图
│       │   ├── download-guide.jpg
│       │   └── ppt-tips.jpg
│       ├── authors/             # 作者头像
│       │   └── pptx-team.jpg
│       └── content/             # 文章内嵌图片
│           └── step-1.png
```

---

## 图片存储规范

### 图片位置

| 图片类型 | 存储路径 | 用途 |
|----------|----------|------|
| 博客封面 | `/public/images/blog/` | frontmatter 的 image 字段 |
| 作者头像 | `/public/images/authors/` | 作者信息的 avatar 字段 |
| 内容图片 | `/public/images/content/` | 文章内嵌图片 |

### 引用方式

```mdx
---
image: /images/blog/download-guide.jpg  # frontmatter 封面
---

![步骤1](/images/content/step-1.png)    # 内容图片
```

### 图片命名规范

- 使用 kebab-case：`download-guide.jpg`
- 包含描述性名称：`ppt-business-template-preview.jpg`
- 推荐格式：JPG（照片）、PNG（截图）、WebP（优化后）

---

## SEO 优化的文章结构

### 完整示例

```mdx
---
title: "免费PPT模板下载指南：2024年最全攻略"
description: "学习如何在PPTX下载站免费获取高质量PPT模板，支持商业用途，无需注册即可下载。"
image: /images/blog/download-guide.jpg
date: "2024-01-15"
published: true
categories: ["tutorial"]
author: "pptx-team"
---

# 免费PPT模板下载指南

## 为什么选择免费PPT模板？

根据 [Statista 2024报告](https://statista.com)，超过 **85%** 的职场人士
每周至少使用一次演示文稿...

## 下载步骤详解

### 第一步：浏览分类

访问我们的 [商务模板分类](/category/business)...

<Callout type="tip">
  💡 专业提示：使用筛选功能可以更快找到合适的模板
</Callout>

### 第二步：预览模板

点击任意模板卡片进入详情页...

### 第三步：下载模板

点击下载按钮，选择格式...

## 常见问题

### 模板可以商用吗？

是的，所有标记为"免费商用"的模板都可以用于商业项目...

### 需要注册账号吗？

不需要，大部分模板支持免登录下载...

## 总结

通过本指南，你已经学会了如何快速找到并下载适合的PPT模板...

<CTAButton href="/categories">立即浏览模板 →</CTAButton>
```

### SEO 要点

1. **标题（H1）** - 包含主关键词，60 字符内
2. **描述** - 包含关键词，155 字符内，有吸引力
3. **标题层级** - H1 → H2 → H3 结构清晰
4. **权威引用** - 引用统计数据和权威来源
5. **内部链接** - 链接到相关分类和文章
6. **FAQ 结构** - 便于 Google 抓取结构化数据
7. **CTA 按钮** - 引导用户行动

---

## 多语言支持

### 文件命名规范

- 默认语言（英文）：`filename.mdx`
- 中文版本：`filename.zh.mdx`

### 示例

```
content/blog/
├── download-guide.mdx      # English
└── download-guide.zh.mdx   # 中文
```

### 中文版 Frontmatter

```mdx
---
title: "免费PPT模板下载指南：2024年最全攻略"
description: "学习如何在PPTX下载站免费获取高质量PPT模板，支持商业用途，无需注册即可下载。"
image: /images/blog/download-guide.jpg
date: "2024-01-15"
published: true
categories: ["tutorial"]
author: "pptx-team"
---
```

---

## 内容创作流程

```
1. 关键词研究
   └── 确定文章主题和目标关键词

2. 创建 MDX 文件
   └── content/blog/article-slug.mdx

3. 填写 Frontmatter
   └── title, description, image, date, categories, author

4. 撰写内容
   └── H1/H2/H3 结构 + 权威引用 + 内部链接

5. 添加图片
   └── public/images/blog/ 和 public/images/content/

6. 创建中文版本
   └── content/blog/article-slug.zh.mdx

7. 检查 SEO
   └── 标题长度、描述长度、关键词密度、链接
```

---

## 作者和分类配置

### 作者文件示例

```mdx
<!-- content/author/pptx-team.mdx -->
---
name: PPTX Team
avatar: /images/authors/pptx-team.jpg
description: Professional PPT template creators
---
```

```mdx
<!-- content/author/pptx-team.zh.mdx -->
---
name: PPTX 团队
avatar: /images/authors/pptx-team.jpg
description: 专业PPT模板创作团队
---
```

### 分类文件示例

```mdx
<!-- content/category/tutorial.mdx -->
---
name: Tutorial
description: Step-by-step guides for using PPT templates
---
```

```mdx
<!-- content/category/tutorial.zh.mdx -->
---
name: 教程
description: PPT模板使用的分步指南
---
```

---

## 未来迁移到 mk-saas

当准备好集成到 mk-saas 时：

1. **复制内容目录**
   ```bash
   cp -r content/blog /path/to/mksaas/content/
   cp -r content/author /path/to/mksaas/content/
   cp -r content/category /path/to/mksaas/content/
   ```

2. **复制图片**
   ```bash
   cp -r public/images/blog /path/to/mksaas/public/images/
   cp -r public/images/authors /path/to/mksaas/public/images/
   cp -r public/images/content /path/to/mksaas/public/images/
   ```

3. **验证 Schema**
   - 确保 frontmatter 字段与 mk-saas 的 `source.config.ts` 匹配

4. **重新生成**
   ```bash
   pnpm run content
   ```

---

## 下一步行动

1. ✅ 创建 `content/blog`、`content/author`、`content/category` 目录
2. ✅ 创建 `public/images/blog`、`public/images/authors`、`public/images/content` 目录
3. ⬜ 创建作者文件：`pptx-team.mdx` 和 `pptx-team.zh.mdx`
4. ⬜ 创建分类文件：tutorial、tips、news 等
5. ⬜ 基于 60+ 主题列表，开始创作第一批 MDX 文章
6. ⬜ 为每篇文章准备封面图

---

## 参考资源

- [mk-saas-blog 官方文档](https://mksaas.com/docs/blog)
- [Fumadocs MDX](https://fumadocs.vercel.app)
- [SEO/GEO 优化策略](./seo-geo/)
- [内容创作主题库](./content-creation-topics.md)
