# Requirements Document

## Introduction

本项目旨在建立一套完整的博客内容处理流水线，将现有的 100 篇 PPT 相关博文从备份目录优化、翻译并迁移到正式的 `content/blog` 目录。流水线包括分类索引建立、SEO/GEO 审计、批量修复、多语言翻译、AI 图片生成等环节，最终产出符合 AdSense 申请标准的高质量双语博客内容。

## Glossary

- **Blog Pipeline**: 博客内容处理流水线系统
- **Blog Audit**: 博客审计工具，用于检查文章的 SEO/GEO 合规性
- **Frontmatter**: MDX 文件头部的 YAML 元数据区域
- **Category Mapping**: 中文分类到英文 slug 的映射关系
- **GEO Optimization**: Generative Engine Optimization，针对 AI 搜索引擎的优化
- **Internal Link**: 站内文章之间的相互引用链接
- **Authority Quote**: 权威数据引用，如来自麦肯锡、哈佛等机构的统计数据
- **Nanobanana/Geminid**: Google Gemini 的图片生成模型
- **Slug**: URL 友好的文章标识符

## Requirements

### Requirement 1: 分类映射与索引系统

**User Story:** As a 系统管理员, I want 建立统一的分类映射和索引系统, so that 所有博文的分类、标签能够与 PPT 资源站 UI 对齐并支持后续查询。

#### Acceptance Criteria

1. WHEN 系统初始化 THEN Blog Pipeline SHALL 加载包含 10 个分类的中英文映射表（商务汇报→business, 教育培训→education, 培训课件→training, 产品营销→marketing, 营销方案→marketing-plan, 年终总结→year-end, 项目提案→proposal, 述职报告→report, 通用→general, 付费与搜索→paid-search）
2. WHEN 解析 ppt-blog-index.ts THEN Blog Pipeline SHALL 输出去重后的分类、标签、文件列表，并标记是否已有英文映射
3. WHEN 生成索引 THEN Blog Pipeline SHALL 输出包含 slug、locale、title、description、date、categories、tags、seoKeywords、image、wordCount、heroImages、internalLinks、externalLinks、status、mediaStatus、issues 字段的 JSON 结构
4. WHEN 分类不存在于映射表 THEN Blog Pipeline SHALL 在审计报告中标记 missing_category issue

### Requirement 2: SEO/GEO 审计系统

**User Story:** As a 内容运营, I want 自动化审计每篇博文的 SEO/GEO 合规性, so that 可以快速识别需要修复的问题并生成修复任务清单。

#### Acceptance Criteria

1. WHEN 审计标题 THEN Blog Pipeline SHALL 检查长度在 25-35 中文字符（≈50-60 英文字符）范围内
2. WHEN 审计描述 THEN Blog Pipeline SHALL 检查长度在 70-100 中文字符（≈140-160 英文字符）范围内
3. WHEN 审计正文结构 THEN Blog Pipeline SHALL 检查 H2 标题数量 ≥5 且 H3 标题数量 ≥5
4. WHEN 审计链接 THEN Blog Pipeline SHALL 检查内部链接数量 ≥3 且外部链接数量 ≥1
5. WHEN 审计权威引用 THEN Blog Pipeline SHALL 检查包含 ≥2 条权威来源引用（含"报告/研究/哈佛/McKinsey/Statista"等关键词）
6. WHEN 审计统计数据 THEN Blog Pipeline SHALL 检查包含 ≥2 条统计数据（含百分比或数字+"调查/报告"）
7. WHEN 审计图片 THEN Blog Pipeline SHALL 检查图片数量 ≥3 且所有图片 alt 文本非空
8. WHEN 审计 FAQ THEN Blog Pipeline SHALL 检查存在"FAQ/常见问题"标题或问答列表
9. WHEN 审计完成 THEN Blog Pipeline SHALL 输出 reports/blog-audit.json 包含每篇文章的 issues 数组和 stats 对象
10. WHEN 运行审计命令 THEN Blog Pipeline SHALL 通过 pnpm blog:audit 命令执行审计脚本

### Requirement 3: Frontmatter 批量修复

**User Story:** As a 内容编辑, I want 批量修复 Frontmatter 中的缺失和错误字段, so that 所有文章的元数据符合 schema 要求。

#### Acceptance Criteria

1. WHEN 修复分类 THEN Blog Pipeline SHALL 将中文分类转换为对应的英文 slug
2. WHEN 修复日期 THEN Blog Pipeline SHALL 确保日期格式为 YYYY-MM-DD
3. WHEN 修复封面图 THEN Blog Pipeline SHALL 设置 image 字段为 /images/blog/{slug}-cover.jpg 格式
4. WHEN 缺少 tags 字段 THEN Blog Pipeline SHALL 根据文章内容和分类自动生成 2-5 个标签
5. WHEN 缺少 seoKeywords 字段 THEN Blog Pipeline SHALL 根据标题和内容提取 3-5 个 SEO 关键词
6. WHEN 缺少 relatedPosts 字段 THEN Blog Pipeline SHALL 根据同分类文章自动推荐 2-3 篇相关文章
7. WHEN 修复完成 THEN Blog Pipeline SHALL 保持原文件路径不变，更新后的内容写回原位置

### Requirement 4: 正文内容批量修复

**User Story:** As a 内容编辑, I want 批量修复正文中的 SEO/GEO 缺陷, so that 文章内容符合搜索引擎优化标准。

#### Acceptance Criteria

1. WHEN 内部链接不足 THEN Blog Pipeline SHALL 在正文中插入 ≥3 个指向同分类文章的内部链接
2. WHEN 缺少权威引用 THEN Blog Pipeline SHALL 在正文中插入 ≥2 条带来源的权威数据引用
3. WHEN 缺少统计数据 THEN Blog Pipeline SHALL 在正文中插入 ≥2 条包含百分比或数值的统计数据
4. WHEN 缺少 FAQ 段落 THEN Blog Pipeline SHALL 在文章末尾添加包含 ≥3 个问答的 FAQ 段落
5. WHEN 图片占位不足 THEN Blog Pipeline SHALL 在正文中插入图片占位符 ![alt](/images/blog/{slug}-{n}.png) 至少 3 个
6. WHEN 缺少 CTA THEN Blog Pipeline SHALL 在文章末尾添加行动号召段落

### Requirement 5: 多语言翻译

**User Story:** As a 国际化运营, I want 将所有中文博文翻译为英文版本, so that 网站支持中英双语内容。

#### Acceptance Criteria

1. WHEN 翻译文章 THEN Blog Pipeline SHALL 生成 {slug}.mdx（英文）与 {slug}.zh.mdx（中文）成对文件
2. WHEN 翻译 Frontmatter THEN Blog Pipeline SHALL 翻译 title 和 description 值，保持 date、image、published、author 不变
3. WHEN 翻译分类 THEN Blog Pipeline SHALL 使用分类映射表将中文分类转换为英文 slug
4. WHEN 翻译正文 THEN Blog Pipeline SHALL 保持 MDX 组件结构（如 Callout）不变，仅翻译标签内容
5. WHEN 翻译正文 THEN Blog Pipeline SHALL 保持图片路径和内部链接路径不变
6. WHEN 翻译完成 THEN Blog Pipeline SHALL 使用美式商务英语风格，语言简洁流畅
7. WHEN 审计缺少英文版 THEN Blog Pipeline SHALL 在 issues 中标记 missing_en

### Requirement 6: AI 图片生成

**User Story:** As a 视觉设计师, I want 使用 AI 为每篇文章生成封面图和内容配图, so that 文章具有专业的视觉呈现。

#### Acceptance Criteria

1. WHEN 生成封面图 THEN Blog Pipeline SHALL 生成 1200x630 像素、小于 200KB 的 JPG 图片
2. WHEN 生成内容图 THEN Blog Pipeline SHALL 生成 1000x600 像素、小于 150KB 的 PNG 图片
3. WHEN 生成图片 THEN Blog Pipeline SHALL 根据文章分类应用对应的视觉风格（商务汇报：深蓝/灰、极简网格；年终总结：暖色、时间线；教育培训：明快、插画式；产品营销：高对比、渐变霓虹）
4. WHEN 生成封面图 THEN Blog Pipeline SHALL 支持在图片中渲染短中文标题（2-6 字）或留白供后期叠字
5. WHEN 生成图片 THEN Blog Pipeline SHALL 输出文件命名为 /images/blog/{slug}-cover.jpg 和 /images/blog/{slug}-{n}.png
6. WHEN 图片生成完成 THEN Blog Pipeline SHALL 更新索引中的 mediaStatus 为 done
7. WHEN 图片暂缺 THEN Blog Pipeline SHALL 放置占位文件并标记 mediaStatus 为 partial

### Requirement 7: 图片任务清单生成

**User Story:** As a 内容运营, I want 生成结构化的图片生成任务清单, so that 可以手工使用 Gemini 客户端逐篇生成图片。

#### Acceptance Criteria

1. WHEN 生成任务清单 THEN Blog Pipeline SHALL 输出包含 slug、title、category、style_hint、palette、scene_elements、scenes、text_to_render、cover_done、inline_done、uploaded 字段的 Markdown 表格
2. WHEN 生成封面 Prompt THEN Blog Pipeline SHALL 包含主题、关键词、需渲染文字、画面元素、颜色、构图要求
3. WHEN 生成内页 Prompt THEN Blog Pipeline SHALL 为每篇文章准备 3-4 个对应正文段落的场景描述
4. WHEN 更新任务状态 THEN Blog Pipeline SHALL 支持标记 cover_done、inline_done、uploaded 状态

### Requirement 8: 内容同步与迁移

**User Story:** As a 系统管理员, I want 将修复后的内容同步到正式目录, so that 博客内容可以在网站上发布。

#### Acceptance Criteria

1. WHEN 同步内容 THEN Blog Pipeline SHALL 将修复后的 MDX 文件从备份目录复制到 content/blog/ 目录
2. WHEN 同步内容 THEN Blog Pipeline SHALL 保留原 广告-博文/ 目录作为备份
3. WHEN 同步图片 THEN Blog Pipeline SHALL 将图片文件放入 public/images/blog/ 目录
4. WHEN 同步完成 THEN Blog Pipeline SHALL 运行 pnpm content 验证 schema 合规性
5. WHEN 同步完成 THEN Blog Pipeline SHALL 更新索引 JSON 文件
6. WHEN 运行同步命令 THEN Blog Pipeline SHALL 通过 pnpm blog:sync 命令执行同步脚本

### Requirement 9: 分类视角差异化

**User Story:** As a 内容策略师, I want 不同分类的文章具有差异化的风格和文案要点, so that 内容更加专业和有针对性。

#### Acceptance Criteria

1. WHEN 处理商务汇报/项目提案类 THEN Blog Pipeline SHALL 应用深蓝/灰色调、强调决策支持和要点速览的文案风格
2. WHEN 处理年终总结/述职类 THEN Blog Pipeline SHALL 应用暖色/中性色调、强调成绩复盘和证据链的文案风格
3. WHEN 处理教育培训类 THEN Blog Pipeline SHALL 应用明快高对比色调、强调互动和步骤化的文案风格
4. WHEN 处理产品营销类 THEN Blog Pipeline SHALL 应用高对比渐变色调、强调转化和亮点钩子的文案风格
5. WHEN 生成内部链接 THEN Blog Pipeline SHALL 优先链接同分类文章，其次链接跨分类的相关主题文章
6. WHEN 生成 FAQ/CTA THEN Blog Pipeline SHALL 根据分类定制问答内容和行动号召

### Requirement 10: 验收与质量保证

**User Story:** As a 质量保证人员, I want 有明确的验收标准和检查流程, so that 可以确保所有内容达到发布标准。

#### Acceptance Criteria

1. WHEN 验收审计结果 THEN Blog Pipeline SHALL 确保核心 issues（no_cover、few_images、no_internal_links、no_authoritative_quote、missing_en）全部清零
2. WHEN 验收文件结构 THEN Blog Pipeline SHALL 确保中英文文件成对存在且分类映射正确
3. WHEN 验收图片资源 THEN Blog Pipeline SHALL 确保所有图片路径无 404、尺寸合规、mediaStatus 为 done
4. WHEN 验收构建 THEN Blog Pipeline SHALL 确保 pnpm content 和 pnpm lint 命令通过
5. WHEN 人工抽检 THEN Blog Pipeline SHALL 每分类随机抽检 2-3 篇，检查语气、流畅度、引用可信度
