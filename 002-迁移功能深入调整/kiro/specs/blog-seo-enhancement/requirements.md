# Requirements Document

## Introduction

本项目旨在为 PPT 下载站建立完整的博客 SEO 优化系统，包括博客内容管理增强、内部链接系统、AI 图片生成、分类标签系统以及与 ai-site 站点的整合迁移。系统采用 MDX + 数据库索引的混合架构，保持内容的 Git 版本控制同时支持动态查询和内部链接跳转。

## Glossary

- **Blog System**: 基于 Fumadocs MDX 管线的博客内容管理系统
- **Blog Index**: 数据库中存储的博客文章索引，用于支持内部链接和动态查询
- **Internal Link**: 博客文章之间的相互引用链接
- **Frontmatter**: MDX 文件头部的元数据定义区域
- **OG Image**: Open Graph 协议定义的社交分享封面图片（1200x630）
- **Content Image**: 博客正文中使用的配图
- **Tag**: 细粒度的文章标签，用于多维度分类
- **Category**: 文章的主分类
- **Slug**: 文章的 URL 友好标识符

## Requirements

### Requirement 1: 博客数据库索引系统

**User Story:** As a 系统管理员, I want 博客文章在数据库中建立索引, so that 可以支持内部链接跳转、相关文章推荐和统计分析。

#### Acceptance Criteria

1. WHEN 博客 MDX 文件被创建或更新 THEN Blog System SHALL 同步更新数据库中的博客索引记录
2. WHEN 查询博客文章 THEN Blog System SHALL 返回包含 slug、title、description、categories、tags、internal_links 的完整索引数据
3. WHEN 博客文章被删除 THEN Blog System SHALL 同步删除数据库中对应的索引记录
4. WHEN 构建时检测到 MDX 文件变更 THEN Blog System SHALL 自动触发索引同步任务

### Requirement 2: Frontmatter Schema 扩展

**User Story:** As a 内容创作者, I want Frontmatter 支持更丰富的元数据字段, so that 可以更好地组织和展示博客内容。

#### Acceptance Criteria

1. WHEN 定义博客 Frontmatter THEN Blog System SHALL 支持 tags 数组字段用于细粒度标签
2. WHEN 定义博客 Frontmatter THEN Blog System SHALL 支持 relatedPosts 数组字段用于手动指定相关文章
3. WHEN 定义博客 Frontmatter THEN Blog System SHALL 支持 seoKeywords 字段用于 SEO 关键词优化
4. WHEN Frontmatter 缺少必填字段 THEN Blog System SHALL 在构建时报告验证错误

### Requirement 3: 内部链接系统

**User Story:** As a 读者, I want 博客文章之间可以相互链接跳转, so that 可以方便地浏览相关内容。

#### Acceptance Criteria

1. WHEN 文章内容包含内部链接语法 THEN Blog System SHALL 解析并渲染为可点击的内部链接
2. WHEN 点击内部链接 THEN Blog System SHALL 导航到目标文章页面
3. WHEN 目标文章不存在 THEN Blog System SHALL 显示友好的 404 提示而非崩溃
4. WHEN 渲染文章页面 THEN Blog System SHALL 在侧边栏或底部显示相关文章推荐

### Requirement 4: AI 封面图生成

**User Story:** As a 内容创作者, I want 系统自动生成符合规范的封面图, so that 可以节省设计时间并保持视觉一致性。

#### Acceptance Criteria

1. WHEN 创建新博客文章且未指定封面图 THEN Blog System SHALL 调用 AI 服务生成 1200x630 像素的封面图
2. WHEN 生成封面图 THEN Blog System SHALL 确保图片文件大小小于 200KB
3. WHEN 生成封面图 THEN Blog System SHALL 基于文章标题和描述生成相关的视觉内容
4. WHEN 封面图生成完成 THEN Blog System SHALL 自动上传到 R2/S3 存储并更新文章的 image 字段

### Requirement 5: AI 内容图生成

**User Story:** As a 内容创作者, I want 系统支持生成文章内容配图, so that 可以丰富文章的视觉表现。

#### Acceptance Criteria

1. WHEN 请求生成内容图 THEN Blog System SHALL 调用 AI 服务生成 800-1000 像素宽的配图
2. WHEN 生成内容图 THEN Blog System SHALL 确保图片文件大小小于 150KB
3. WHEN 内容图生成完成 THEN Blog System SHALL 返回可直接插入 MDX 的图片引用语法
4. WHEN 批量生成内容图 THEN Blog System SHALL 支持队列处理避免 API 限流

### Requirement 6: 分类与标签系统增强

**User Story:** As a 读者, I want 通过分类和标签筛选博客文章, so that 可以快速找到感兴趣的内容。

#### Acceptance Criteria

1. WHEN 访问博客列表页 THEN Blog System SHALL 显示所有可用的分类和标签筛选器
2. WHEN 选择分类筛选 THEN Blog System SHALL 仅显示属于该分类的文章
3. WHEN 选择标签筛选 THEN Blog System SHALL 显示包含该标签的所有文章
4. WHEN 同时选择分类和标签 THEN Blog System SHALL 显示同时满足两个条件的文章
5. WHEN 显示分类或标签 THEN Blog System SHALL 同时显示该分类或标签下的文章数量

### Requirement 7: 博客文章迁移

**User Story:** As a 系统管理员, I want 将备份目录中的 100 篇文章迁移到正式目录, so that 可以正式发布这些内容。

#### Acceptance Criteria

1. WHEN 执行迁移脚本 THEN Blog System SHALL 将文章从备份目录复制到 content/blog 目录
2. WHEN 迁移文章 THEN Blog System SHALL 验证并补全 Frontmatter 必填字段
3. WHEN 迁移文章 THEN Blog System SHALL 保持原有的分类映射关系
4. WHEN 迁移完成 THEN Blog System SHALL 生成迁移报告包含成功和失败的文章列表
5. WHEN 文章缺少封面图 THEN Blog System SHALL 标记该文章需要生成封面图

### Requirement 8: 博客分页系统

**User Story:** As a 读者, I want 博客列表支持分页浏览, so that 可以在大量文章中有序浏览。

#### Acceptance Criteria

1. WHEN 博客文章数量超过每页限制 THEN Blog System SHALL 自动启用分页功能
2. WHEN 显示分页 THEN Blog System SHALL 提供上一页、下一页和页码导航
3. WHEN 切换分页 THEN Blog System SHALL 保持当前的分类和标签筛选状态
4. WHEN URL 包含页码参数 THEN Blog System SHALL 直接显示对应页的内容

### Requirement 9: SEO 优化

**User Story:** As a 网站运营者, I want 博客系统具备完善的 SEO 功能, so that 可以提升搜索引擎排名和流量。

#### Acceptance Criteria

1. WHEN 渲染博客页面 THEN Blog System SHALL 生成完整的 Open Graph 和 Twitter Card 元标签
2. WHEN 构建站点 THEN Blog System SHALL 自动生成包含所有博客文章的 sitemap.xml
3. WHEN 渲染博客页面 THEN Blog System SHALL 生成 JSON-LD 结构化数据（Article schema）
4. WHEN 文章包含 seoKeywords THEN Blog System SHALL 将其添加到页面的 meta keywords 标签

### Requirement 10: 与 ai-site 整合准备

**User Story:** As a 系统架构师, I want 博客系统设计兼容 mk-saas 平台, so that 未来可以无缝迁移。

#### Acceptance Criteria

1. WHEN 设计数据库 schema THEN Blog System SHALL 使用与 mk-saas 兼容的字段命名和数据类型
2. WHEN 存储图片资源 THEN Blog System SHALL 使用统一的 CDN 路径格式
3. WHEN 定义 API 接口 THEN Blog System SHALL 遵循 RESTful 设计规范
4. WHEN 导出博客数据 THEN Blog System SHALL 支持标准 JSON 格式导出
