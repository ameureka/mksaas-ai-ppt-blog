# Requirements Document: Gemini Image Pipeline

## Introduction

本项目旨在建立一套基于 Gemini CLI 和网页工具的博客图片批量生成流水线，为 100 篇 PPT 相关博文高效生成 400+ 张图片（封面 + 内页配图）。流水线采用半自动化设计，支持 CLI 批量生成和网页手工补充两种模式，包含 Prompt 生成、图片生成、后处理、同步部署四个阶段。

## Glossary

- **Image Pipeline**: 图片生成流水线系统
- **Cover Image**: 封面图，1200x630 像素，用于博客列表和社交分享
- **Inline Image**: 内页配图，1000x600 像素，用于正文插图
- **Prompt Extractor**: 从 MDX 文件提取内容并生成图片 Prompt 的脚本
- **Image Task**: 单篇文章的图片生成任务，包含封面和内页 Prompt
- **Nanobanana**: Google Gemini 的图片生成能力代号
- **Text Strategy**: 封面文字渲染策略（短中文/英文/留白）
- **Media Status**: 图片资源状态（none/partial/done）
- **Style Hint**: 基于分类的视觉风格提示

## Requirements

### Requirement 1: Prompt 自动生成系统

**User Story:** As a 内容运营, I want 自动从 MDX 文件提取内容并生成结构化的图片 Prompt, so that 可以快速准备批量图片生成任务。

#### Acceptance Criteria

1. WHEN 扫描 MDX 文件 THEN Image Pipeline SHALL 读取 frontmatter 中的 title、description、categories 字段
2. WHEN 解析正文 THEN Image Pipeline SHALL 提取 H2/H3 标题作为内页场景候选
3. WHEN 生成封面 Prompt THEN Image Pipeline SHALL 包含主题、关键词、文字渲染策略、画面元素、配色、构图要求
4. WHEN 生成内页 Prompt THEN Image Pipeline SHALL 为每篇文章生成 3-4 个对应正文段落的场景 Prompt
5. WHEN 输出任务清单 THEN Image Pipeline SHALL 生成 image-tasks.json 包含所有任务的结构化数据
6. WHEN 输出可读清单 THEN Image Pipeline SHALL 生成 image-tasks.md 供手工复制使用
7. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:prompts` 执行 Prompt 生成脚本

### Requirement 2: 分类风格映射

**User Story:** As a 视觉设计师, I want 不同分类的文章自动应用对应的视觉风格, so that 图片风格与内容主题一致。

#### Acceptance Criteria

1. WHEN 处理商务汇报/项目提案类 THEN Image Pipeline SHALL 应用深蓝/灰色调、极简网格、数据卡片/折线、科技光影风格
2. WHEN 处理年终总结/述职类 THEN Image Pipeline SHALL 应用暖色/中性色调、时间线+图表、稳重风格
3. WHEN 处理教育培训类 THEN Image Pipeline SHALL 应用明快高对比色调、插画人物、卡片分组风格
4. WHEN 处理产品营销类 THEN Image Pipeline SHALL 应用高对比渐变色调、大标题、霓虹、情境 mock 风格
5. WHEN 处理通用/付费搜索类 THEN Image Pipeline SHALL 应用中性蓝灰色调、信息图风格
6. WHEN 分类映射 THEN Image Pipeline SHALL 输出 style_hint 和 palette 字段供 Prompt 使用

### Requirement 3: 中文文字渲染策略

**User Story:** As a 内容运营, I want 系统自动选择合适的文字渲染策略, so that 封面图中的文字清晰可读。

#### Acceptance Criteria

1. WHEN 标题长度 ≤6 字 THEN Image Pipeline SHALL 默认使用 short-zh 策略，直接渲染中文
2. WHEN 标题长度 >6 字 THEN Image Pipeline SHALL 提取 2-6 字核心关键词作为渲染文字
3. WHEN 用户指定 THEN Image Pipeline SHALL 支持 english 策略，使用英文标题
4. WHEN 用户指定 THEN Image Pipeline SHALL 支持 blank 策略，生成留白供后期叠字
5. WHEN 生成 Prompt THEN Image Pipeline SHALL 在 text_to_render 字段中包含最终渲染文字或留白指令

### Requirement 4: Gemini CLI 批量生成

**User Story:** As a 系统管理员, I want 通过 CLI 脚本批量调用 Gemini 生成图片, so that 可以自动化处理大量图片任务。

#### Acceptance Criteria

1. WHEN 执行批量生成 THEN Image Pipeline SHALL 读取 image-tasks.json 中状态为 pending 的任务
2. WHEN 调用 Gemini CLI THEN Image Pipeline SHALL 使用 `gemini generate-image` 命令生成图片
3. WHEN 生成封面 THEN Image Pipeline SHALL 指定尺寸为 1200x630
4. WHEN 生成内页 THEN Image Pipeline SHALL 指定尺寸为 1000x600
5. WHEN 生成成功 THEN Image Pipeline SHALL 更新任务状态为 generated 并记录文件路径
6. WHEN 生成失败 THEN Image Pipeline SHALL 记录错误日志并保持状态为 pending
7. WHEN 避免限流 THEN Image Pipeline SHALL 在每次生成后等待 2-5 秒
8. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:generate` 执行批量生成脚本

### Requirement 5: 网页手工生成支持

**User Story:** As a 内容运营, I want 在 CLI 失败时能够切换到网页手工生成, so that 可以确保所有图片任务完成。

#### Acceptance Criteria

1. WHEN 导出待处理清单 THEN Image Pipeline SHALL 生成 pending-prompts.md 包含所有 pending 状态的 Prompt
2. WHEN 格式化 Prompt THEN Image Pipeline SHALL 使用 Markdown 代码块便于复制粘贴
3. WHEN 标记完成 THEN Image Pipeline SHALL 提供 `pnpm image:mark-complete` 命令更新任务状态
4. WHEN 手工生成 THEN Image Pipeline SHALL 在 pending-prompts.md 中包含文件命名规范提示

### Requirement 6: 图片后处理

**User Story:** As a 系统管理员, I want 自动压缩和规范化生成的图片, so that 图片符合网站性能要求。

#### Acceptance Criteria

1. WHEN 压缩 JPG THEN Image Pipeline SHALL 使用 quality=85 压缩至 <200KB
2. WHEN 压缩 PNG THEN Image Pipeline SHALL 使用 pngquant quality=65-80 压缩至 <150KB
3. WHEN 规范化命名 THEN Image Pipeline SHALL 确保文件名为小写、连字符分隔
4. WHEN 封面命名 THEN Image Pipeline SHALL 使用 {slug}-cover.jpg 格式
5. WHEN 内页命名 THEN Image Pipeline SHALL 使用 {slug}-{n}.png 格式（n 从 1 开始）
6. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:compress` 执行压缩脚本

### Requirement 7: 状态追踪与更新

**User Story:** As a 内容运营, I want 追踪每个图片任务的状态, so that 可以了解整体进度并识别待处理项。

#### Acceptance Criteria

1. WHEN 追踪状态 THEN Image Pipeline SHALL 维护 pending/generated/approved/uploaded 四种状态
2. WHEN 更新封面状态 THEN Image Pipeline SHALL 在 image-tasks.json 中更新 cover.status 字段
3. WHEN 更新内页状态 THEN Image Pipeline SHALL 在 image-tasks.json 中更新 inlineImages[].status 字段
4. WHEN 计算整体状态 THEN Image Pipeline SHALL 根据封面和内页状态计算 mediaStatus（none/partial/done）
5. WHEN 显示进度 THEN Image Pipeline SHALL 通过 `pnpm image:progress` 输出统计信息

### Requirement 8: S3/CDN 同步部署

**User Story:** As a 系统管理员, I want 将图片同步到 S3/CDN, so that 图片可以在生产环境访问。

#### Acceptance Criteria

1. WHEN 本地存储 THEN Image Pipeline SHALL 将图片放入 public/images/blog/ 目录
2. WHEN 同步 S3 THEN Image Pipeline SHALL 使用 aws s3 sync 命令上传图片
3. WHEN 设置缓存 THEN Image Pipeline SHALL 配置 Cache-Control: max-age=31536000
4. WHEN 设置权限 THEN Image Pipeline SHALL 配置 ACL 为 public-read
5. WHEN 同步完成 THEN Image Pipeline SHALL 更新任务状态为 uploaded
6. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:upload` 执行上传脚本

### Requirement 9: MDX Frontmatter 更新

**User Story:** As a 内容编辑, I want 自动更新 MDX 文件中的图片路径, so that 文章能够正确引用生成的图片。

#### Acceptance Criteria

1. WHEN 更新封面 THEN Image Pipeline SHALL 设置 frontmatter.image 为 /images/blog/{slug}-cover.jpg
2. WHEN 更新正文 THEN Image Pipeline SHALL 替换占位符 ![placeholder-{n}] 为实际图片路径
3. WHEN 生成 alt 文本 THEN Image Pipeline SHALL 使用场景描述作为 alt 属性值
4. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:update-mdx` 执行更新脚本

### Requirement 10: 质量检查与验收

**User Story:** As a 质量保证人员, I want 有明确的图片质量检查标准, so that 可以确保所有图片达到发布标准。

#### Acceptance Criteria

1. WHEN 检查封面 THEN Image Pipeline SHALL 验证尺寸为 1200x630、文件大小 <200KB
2. WHEN 检查内页 THEN Image Pipeline SHALL 验证尺寸为 1000x600、文件大小 <150KB
3. WHEN 检查文字 THEN Image Pipeline SHALL 验证封面文字清晰可读（如有）
4. WHEN 检查风格 THEN Image Pipeline SHALL 验证图片风格符合分类要求
5. WHEN 检查完整性 THEN Image Pipeline SHALL 验证每篇文章有 1 张封面 + ≥3 张内页
6. WHEN 验收完成 THEN Image Pipeline SHALL 确保所有 mediaStatus 为 done
7. WHEN 运行命令 THEN Image Pipeline SHALL 通过 `pnpm image:check` 执行质量检查脚本
