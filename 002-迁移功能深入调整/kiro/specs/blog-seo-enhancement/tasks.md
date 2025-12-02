# Implementation Plan

## Phase 1: 数据库基础设施

- [ ] 1. 创建博客索引数据库表
  - [ ] 1.1 创建 blog_index 表 schema
    - 添加 slug, locale, title, description, image, date, published 等基础字段
    - 添加 categories, tags, seoKeywords 数组字段
    - 添加 internalLinks, backlinks, relatedPosts 链接字段
    - 添加 viewCount, filePath, contentHash 元数据字段
    - 创建必要的索引
    - _Requirements: 1.1, 1.2_
  - [ ]* 1.2 Write property test for blog index schema
    - **Property 1: 索引同步一致性**
    - **Validates: Requirements 1.1, 1.2**
  - [ ] 1.3 创建 blog_tag 表 schema
    - 添加 name, slug, description, postCount 字段
    - _Requirements: 6.5_
  - [ ] 1.4 生成并执行数据库迁移
    - 运行 pnpm db:generate 和 pnpm db:migrate
    - _Requirements: 1.1_

## Phase 2: Frontmatter Schema 扩展

- [ ] 2. 扩展博客 Frontmatter Schema
  - [ ] 2.1 更新 source.config.ts 中的 blog schema
    - 添加 tags: z.array(z.string()).optional().default([])
    - 添加 relatedPosts: z.array(z.string()).optional().default([])
    - 添加 seoKeywords: z.array(z.string()).optional().default([])
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 2.2 Write property test for Frontmatter validation
    - **Property 3: Frontmatter Schema 验证**
    - **Property 4: Frontmatter 必填字段验证**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [ ] 2.3 更新现有博客文章的 Frontmatter 类型定义
    - 更新 TypeScript 类型以包含新字段
    - _Requirements: 2.1, 2.2, 2.3_

## Phase 3: 博客索引同步服务

- [ ] 3. 实现博客索引同步服务
  - [ ] 3.1 创建 src/lib/blog/indexer.ts
    - 实现 syncAll() 方法同步所有博客文章
    - 实现 syncOne() 方法同步单篇文章
    - 实现 removeIndex() 方法删除索引
    - 实现内容哈希计算用于检测变更
    - _Requirements: 1.1, 1.3_
  - [ ]* 3.2 Write property test for index sync
    - **Property 1: 索引同步一致性**
    - **Property 2: 索引删除一致性**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ] 3.3 创建同步脚本 scripts/sync-blog-index.ts
    - 支持命令行执行完整同步
    - 支持增量同步模式
    - _Requirements: 1.4_
  - [ ] 3.4 集成到构建流程
    - 在 package.json 添加 blog:sync 脚本
    - _Requirements: 1.4_

- [ ] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 内部链接系统

- [ ] 5. 实现内部链接解析器
  - [ ] 5.1 创建 src/lib/blog/internal-link-parser.ts
    - 实现 parse() 方法解析 [[slug]] 和 [[slug|text]] 语法
    - 实现 transform() 方法转换为 React 组件
    - 实现 validate() 方法验证链接目标存在性
    - _Requirements: 3.1, 3.3_
  - [ ]* 5.2 Write property test for internal link parsing
    - **Property 5: 内部链接解析**
    - **Validates: Requirements 3.1**
  - [ ] 5.3 创建 InternalLink React 组件
    - 渲染可点击的内部链接
    - 处理链接目标不存在的情况
    - _Requirements: 3.2, 3.3_
  - [ ] 5.4 实现反向链接更新逻辑
    - 在索引同步时更新 backlinks 字段
    - _Requirements: 3.1_

- [ ] 6. 实现相关文章推荐
  - [ ] 6.1 创建 src/lib/blog/related-posts.ts
    - 基于 relatedPosts 字段获取手动指定的相关文章
    - 基于 categories 和 tags 自动推荐相关文章
    - _Requirements: 3.4_
  - [ ] 6.2 创建 RelatedPosts React 组件
    - 在文章底部显示相关文章列表
    - _Requirements: 3.4_

## Phase 5: AI 图片生成服务

- [ ] 7. 实现 AI 图片生成服务
  - [ ] 7.1 创建 src/lib/blog/image-generator.ts
    - 配置 Gemini/Imagen API 客户端
    - 实现 generateCover() 方法生成 1200x630 封面图
    - 实现 generateContent() 方法生成 800-1000 宽内容图
    - _Requirements: 4.1, 5.1_
  - [ ]* 7.2 Write property test for image size constraints
    - **Property 6: 封面图尺寸约束**
    - **Property 7: 内容图尺寸约束**
    - **Validates: Requirements 4.1, 4.2, 5.1, 5.2**
  - [ ] 7.3 实现图片压缩工具
    - 使用 sharp 库压缩图片到目标大小
    - 封面图 < 200KB，内容图 < 150KB
    - _Requirements: 4.2, 5.2_
  - [ ] 7.4 实现图片上传到 R2/S3
    - 使用现有的 storage 模块上传图片
    - 返回 CDN URL
    - _Requirements: 4.4, 10.2_
  - [ ]* 7.5 Write property test for CDN path format
    - **Property 23: CDN 路径格式**
    - **Validates: Requirements 10.2**
  - [ ] 7.6 实现 MDX 图片语法生成
    - 返回可直接插入 MDX 的图片引用语法
    - _Requirements: 5.3_
  - [ ]* 7.7 Write property test for MDX image syntax
    - **Property 8: 内容图 MDX 语法**
    - **Validates: Requirements 5.3**

- [ ] 8. 创建图片生成 API 路由
  - [ ] 8.1 创建 src/app/api/blog/generate-image/route.ts
    - POST 接口接收 title, description, type 参数
    - 返回生成的图片 URL
    - _Requirements: 4.1, 5.1_
  - [ ] 8.2 实现批量生成队列
    - 支持队列处理避免 API 限流
    - _Requirements: 5.4_

- [ ] 9. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 博客查询服务

- [ ] 10. 实现博客查询服务
  - [ ] 10.1 创建 src/lib/blog/query-service.ts
    - 实现 list() 方法支持分类、标签筛选和分页
    - 实现 getBySlug() 方法获取单篇文章
    - 实现 getRelated() 方法获取相关文章
    - 实现 getCategories() 和 getTags() 方法
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 10.2 Write property tests for filtering
    - **Property 9: 分类筛选准确性**
    - **Property 10: 标签筛选准确性**
    - **Property 11: 组合筛选准确性**
    - **Property 12: 分类/标签计数准确性**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
  - [ ] 10.3 实现分页逻辑
    - 支持 page 和 pageSize 参数
    - 返回 total, totalPages 等分页信息
    - _Requirements: 8.1, 8.2_
  - [ ]* 10.4 Write property tests for pagination
    - **Property 16: 分页触发条件**
    - **Property 17: 分页状态保持**
    - **Property 18: URL 页码解析**
    - **Validates: Requirements 8.1, 8.3, 8.4**

## Phase 7: 分类与标签系统增强

- [ ] 11. 增强分类筛选组件
  - [ ] 11.1 更新 src/components/blog/blog-category-filter.tsx
    - 显示分类下的文章数量
    - 支持多分类选择
    - _Requirements: 6.1, 6.5_
  - [ ] 11.2 创建标签筛选组件 src/components/blog/blog-tag-filter.tsx
    - 显示所有可用标签
    - 显示标签下的文章数量
    - 支持多标签选择
    - _Requirements: 6.1, 6.3, 6.5_
  - [ ] 11.3 更新博客列表页支持组合筛选
    - URL 参数支持 category 和 tag
    - 切换分页时保持筛选状态
    - _Requirements: 6.4, 8.3_

## Phase 8: 博客文章迁移

- [ ] 12. 实现博客迁移工具
  - [ ] 12.1 创建 scripts/migrate-blogs.ts
    - 读取备份目录中的 MDX 文件
    - 验证 Frontmatter 必填字段
    - 补全缺失字段
    - 复制到 content/blog 目录
    - _Requirements: 7.1, 7.2_
  - [ ]* 12.2 Write property tests for migration
    - **Property 13: 迁移 Frontmatter 验证**
    - **Property 14: 迁移分类映射**
    - **Property 15: 缺失封面图标记**
    - **Validates: Requirements 7.2, 7.3, 7.5**
  - [ ] 12.3 实现分类映射逻辑
    - 根据 ppt-blog-index.ts 中的映射关系转换分类
    - _Requirements: 7.3_
  - [ ] 12.4 实现迁移报告生成
    - 输出成功、失败、需要封面图的文章列表
    - _Requirements: 7.4, 7.5_
  - [ ] 12.5 执行迁移并验证
    - 运行迁移脚本
    - 验证迁移结果
    - _Requirements: 7.1_

- [ ] 13. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: SEO 优化

- [ ] 14. 实现 SEO 元标签生成
  - [ ] 14.1 更新博客文章页面的 metadata 生成
    - 生成完整的 Open Graph 标签
    - 生成 Twitter Card 标签
    - 添加 seoKeywords 到 meta keywords
    - _Requirements: 9.1, 9.4_
  - [ ]* 14.2 Write property tests for SEO meta tags
    - **Property 19: OG 元标签完整性**
    - **Property 22: SEO Keywords 元标签**
    - **Validates: Requirements 9.1, 9.4**
  - [ ] 14.3 实现 JSON-LD 结构化数据
    - 生成 Article schema 的 JSON-LD
    - 包含 author, datePublished, image 等字段
    - _Requirements: 9.3_
  - [ ]* 14.4 Write property test for JSON-LD
    - **Property 21: JSON-LD 结构化数据**
    - **Validates: Requirements 9.3**

- [ ] 15. 优化 Sitemap 生成
  - [ ] 15.1 更新 sitemap 生成逻辑
    - 包含所有已发布的博客文章
    - 添加 lastmod, changefreq, priority
    - _Requirements: 9.2_
  - [ ]* 15.2 Write property test for sitemap
    - **Property 20: Sitemap 完整性**
    - **Validates: Requirements 9.2**

## Phase 10: 数据导出与整合准备

- [ ] 16. 实现数据导出功能
  - [ ] 16.1 创建 src/lib/blog/exporter.ts
    - 实现 exportToJSON() 方法导出所有博客数据
    - 支持按分类、标签筛选导出
    - _Requirements: 10.4_
  - [ ]* 16.2 Write property test for JSON export
    - **Property 24: JSON 导出格式**
    - **Validates: Requirements 10.4**
  - [ ] 16.3 创建导出脚本 scripts/export-blogs.ts
    - 支持命令行执行导出
    - _Requirements: 10.4_

- [ ] 17. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
