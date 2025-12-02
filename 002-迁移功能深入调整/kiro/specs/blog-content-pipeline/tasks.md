# Implementation Plan

> **注意**: 所有代码先在 `深入细化调整/006-01-博客内容创作/draft-code/` 目录开发，校验通过后再迁移到主项目。

## Phase 1: 基础设施搭建

- [x] 1. 创建 draft-code 目录结构和基础配置
  - [x] 1.1 创建目录结构
    - 创建 `深入细化调整/006-01-博客内容创作/draft-code/` 目录
    - 创建子目录：scripts/、config/、reports/
    - 创建 README.md 说明文档
    - _Requirements: 1.1_
  - [x] 1.2 创建分类映射常量文件
    - 创建 `draft-code/config/category-map.ts`
    - 定义 10 个分类的中英文映射
    - 定义每个分类的视觉风格配置
    - _Requirements: 1.1, 9.1-9.6_
  - [ ]* 1.3 Write property test for category mapping
    - **Property 1: 分类映射完整性**
    - **Validates: Requirements 1.1**

## Phase 2: 审计脚本开发

- [x] 2. 实现博客审计脚本
  - [x] 2.1 创建审计脚本框架
    - 创建 `draft-code/scripts/blog-audit/index.ts`
    - 定义 AuditConfig、AuditRules、BlogAuditResult 接口
    - 实现 MDX 文件扫描和 Frontmatter 解析
    - _Requirements: 2.9, 2.10_
  - [x] 2.2 实现标题和描述长度检查
    - 实现中文字符计数函数
    - 检查标题长度 25-35 字符
    - 检查描述长度 70-100 字符
    - _Requirements: 2.1, 2.2_
  - [ ]* 2.3 Write property test for length checking
    - **Property 3: 标题长度检查**
    - **Property 4: 描述长度检查**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 2.4 实现正文结构检查
    - 解析 Markdown 标题层级
    - 统计 H2 和 H3 数量
    - 检查是否 ≥5
    - _Requirements: 2.3_
  - [ ]* 2.5 Write property test for heading structure
    - **Property 5: 标题结构检查**
    - **Validates: Requirements 2.3**
  - [x] 2.6 实现链接检查
    - 解析正文中的链接
    - 区分内部链接（/ 开头）和外部链接（http/https）
    - 统计数量并检查阈值
    - _Requirements: 2.4_
  - [ ]* 2.7 Write property test for link classification
    - **Property 6: 链接分类检查**
    - **Validates: Requirements 2.4**
  - [x] 2.8 实现权威引用和统计数据检查
    - 实现权威来源关键词匹配（报告/研究/哈佛/McKinsey/Statista）
    - 实现统计数据匹配（百分比、数字+调查/报告）
    - _Requirements: 2.5, 2.6_
  - [ ]* 2.9 Write property test for authority and stats detection
    - **Property 7: 权威引用检测**
    - **Property 8: 统计数据检测**
    - **Validates: Requirements 2.5, 2.6**
  - [x] 2.10 实现图片和 FAQ 检查
    - 解析 Markdown 图片语法
    - 检查图片数量和 alt 文本
    - 检测 FAQ 标题或问答列表
    - _Requirements: 2.7, 2.8_
  - [ ]* 2.11 Write property test for image and FAQ detection
    - **Property 9: 图片检测**
    - **Validates: Requirements 2.7, 2.8**
  - [x] 2.12 实现审计报告生成
    - 汇总所有检查结果
    - 生成 issues 数组和 stats 对象
    - 输出 JSON 报告到 `draft-code/reports/blog-audit.json`
    - _Requirements: 2.9_

- [ ] 3. Checkpoint - 审计脚本验证
  - Ensure all tests pass, ask the user if questions arise.
  - 运行审计脚本对 100 篇博文进行首轮审计
  - 生成审计报告并分析主要问题

## Phase 3: 修复脚本开发

- [x] 4. 实现 Frontmatter 修复脚本
  - [x] 4.1 创建修复脚本框架
    - 创建 `draft-code/scripts/blog-fix/index.ts`
    - 定义 FixConfig、FixType、FixResult 接口
    - 实现 MDX 文件读写和 Frontmatter 解析/序列化
    - _Requirements: 3.7_
  - [x] 4.2 实现分类修复
    - 读取分类映射表
    - 将中文分类转换为英文 slug
    - _Requirements: 3.1_
  - [ ]* 4.3 Write property test for category fix
    - **Property 10: 分类修复正确性**
    - **Validates: Requirements 3.1**
  - [x] 4.4 实现日期和封面图路径修复
    - 验证并修复日期格式为 YYYY-MM-DD
    - 设置 image 字段为 /images/blog/{slug}-cover.jpg
    - _Requirements: 3.2, 3.3_
  - [ ]* 4.5 Write property test for date and image path
    - **Property 11: 日期格式修复**
    - **Property 12: 封面图路径格式**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 4.6 实现 tags 和 seoKeywords 自动生成
    - 根据文章内容和分类生成 2-5 个标签
    - 根据标题和内容提取 3-5 个 SEO 关键词
    - _Requirements: 3.4, 3.5_
  - [x] 4.7 实现 relatedPosts 自动推荐
    - 根据同分类文章推荐 2-3 篇相关文章
    - _Requirements: 3.6_

- [x] 5. 实现正文内容修复脚本
  - [x] 5.1 实现内部链接插入
    - 根据同分类文章生成内部链接
    - 在正文适当位置插入 ≥3 个内部链接
    - _Requirements: 4.1_
  - [ ]* 5.2 Write property test for internal links fix
    - **Property 13: 内部链接修复**
    - **Validates: Requirements 4.1**
  - [x] 5.3 实现权威引用和统计数据插入
    - 生成权威数据引用模板
    - 在正文中插入 ≥2 条引用和 ≥2 条统计
    - _Requirements: 4.2, 4.3_
  - [x] 5.4 实现 FAQ 和 CTA 段落生成
    - 生成包含 ≥3 个问答的 FAQ 段落
    - 生成行动号召段落
    - _Requirements: 4.4, 4.6_
  - [x] 5.5 实现图片占位符插入
    - 在正文中插入 ![alt](/images/blog/{slug}-{n}.png) 占位符
    - 确保至少 3 个图片占位
    - _Requirements: 4.5_

- [ ] 6. Checkpoint - 修复脚本验证
  - Ensure all tests pass, ask the user if questions arise.
  - 运行修复脚本对问题文章进行修复
  - 重新运行审计验证 issues 减少

## Phase 4: 翻译脚本开发

- [x] 7. 实现多语言翻译脚本
  - [x] 7.1 创建翻译脚本框架
    - 创建 `draft-code/scripts/blog-translate/index.ts`
    - 定义 TranslateConfig、TranslateResult 接口
    - 实现翻译 Prompt 模板
    - _Requirements: 5.1_
  - [x] 7.2 实现 Frontmatter 翻译逻辑
    - 翻译 title 和 description
    - 保持 date、image、published、author 不变
    - 使用映射表转换 categories
    - _Requirements: 5.2, 5.3_
  - [ ]* 7.3 Write property test for frontmatter translation
    - **Property 15: 翻译 Frontmatter 保持**
    - **Validates: Requirements 5.2**
  - [x] 7.4 实现正文翻译逻辑
    - 保持 MDX 组件结构不变
    - 保持图片路径和内部链接路径不变
    - _Requirements: 5.4, 5.5_
  - [ ]* 7.5 Write property test for content translation
    - **Property 16: 翻译路径保持**
    - **Validates: Requirements 5.5**
  - [x] 7.6 实现文件输出
    - 生成 {slug}.mdx（英文）和 {slug}.zh.mdx（中文）成对文件
    - _Requirements: 5.1_
  - [ ]* 7.7 Write property test for file pairing
    - **Property 14: 翻译文件配对**
    - **Validates: Requirements 5.1**
  - [x] 7.8 实现 missing_en issue 检测
    - 在审计中检测缺少英文版的文章
    - _Requirements: 5.7_

- [ ] 8. Checkpoint - 翻译脚本验证
  - Ensure all tests pass, ask the user if questions arise.
  - 抽取 5 篇文章测试翻译流程
  - 人工校对翻译质量

## Phase 5: 图片任务生成

- [x] 9. 实现图片任务生成脚本
  - [x] 9.1 创建图片任务脚本框架
    - 创建 `draft-code/scripts/blog-image-tasks/index.ts`
    - 定义 ImageTaskConfig、ImageTask 接口
    - _Requirements: 7.1_
  - [x] 9.2 实现封面 Prompt 生成
    - 根据文章标题、分类生成封面 Prompt
    - 包含主题、关键词、文字、画面元素、颜色
    - _Requirements: 7.2_
  - [x] 9.3 实现内页 Prompt 生成
    - 分析文章结构，提取 3-4 个场景
    - 为每个场景生成内页 Prompt
    - _Requirements: 7.3_
  - [ ]* 9.4 Write property test for image task generation
    - **Property 20: 图片任务清单完整性**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  - [x] 9.5 实现任务清单输出
    - 输出 Markdown 表格格式的任务清单
    - 包含状态追踪字段（cover_done、inline_done、uploaded）
    - 输出到 `draft-code/reports/image-tasks.md`
    - _Requirements: 7.4_

- [x] 10. 实现图片规格验证工具
  - [x] 10.1 创建图片验证脚本
    - 创建 `draft-code/scripts/blog-image-tasks/validate.ts`
    - 验证封面图尺寸 1200x630、大小 <200KB
    - 验证内容图尺寸 1000x600、大小 <150KB
    - _Requirements: 6.1, 6.2_
  - [ ]* 10.2 Write property test for image validation
    - **Property 17: 封面图尺寸**
    - **Property 18: 内容图尺寸**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 10.3 实现图片命名验证
    - 验证封面命名为 {slug}-cover.jpg
    - 验证内页命名为 {slug}-{n}.png
    - _Requirements: 6.5_
  - [ ]* 10.4 Write property test for image naming
    - **Property 19: 图片命名规范**
    - **Validates: Requirements 6.5**
  - [x] 10.5 实现 mediaStatus 更新
    - 根据图片完成情况更新索引中的 mediaStatus
    - _Requirements: 6.6, 6.7_

- [ ] 11. Checkpoint - 图片任务验证
  - Ensure all tests pass, ask the user if questions arise.
  - 生成完整的图片任务清单
  - 验证 Prompt 质量

## Phase 6: 同步脚本开发

- [x] 12. 实现内容同步脚本
  - [x] 12.1 创建同步脚本框架
    - 创建 `draft-code/scripts/blog-sync/index.ts`
    - 定义 SyncConfig、SyncResult 接口
    - _Requirements: 8.6_
  - [x] 12.2 实现 MDX 文件同步
    - 从备份目录复制到 content/blog/
    - 保留原目录作为备份
    - _Requirements: 8.1, 8.2_
  - [x] 12.3 实现图片文件同步
    - 将图片放入 public/images/blog/
    - _Requirements: 8.3_
  - [x] 12.4 实现 schema 验证集成
    - 同步后运行 pnpm content 验证
    - _Requirements: 8.4_
  - [x] 12.5 实现索引更新
    - 更新索引 JSON 文件
    - _Requirements: 8.5_

## Phase 7: 验收与质量保证

- [x] 13. 实现验收检查脚本
  - [x] 13.1 创建验收脚本
    - 创建 `draft-code/scripts/blog-validate/index.ts`
    - 检查核心 issues 是否清零
    - _Requirements: 10.1_
  - [ ]* 13.2 Write property test for acceptance validation
    - **Property 21: 验收 issues 清零**
    - **Validates: Requirements 10.1**
  - [x] 13.3 实现文件配对检查
    - 检查中英文文件成对存在
    - 检查分类映射正确
    - _Requirements: 10.2_
  - [ ]* 13.4 Write property test for file pairing validation
    - **Property 22: 验收文件配对**
    - **Validates: Requirements 10.2**
  - [x] 13.5 实现图片可用性检查
    - 检查所有图片路径无 404
    - 检查 mediaStatus 为 done
    - _Requirements: 10.3_
  - [ ]* 13.6 Write property test for image availability
    - **Property 23: 验收图片可用**
    - **Validates: Requirements 10.3**
  - [x] 13.7 实现构建验证
    - 运行 pnpm content 和 pnpm lint
    - _Requirements: 10.4_

- [ ] 14. Final Checkpoint - 完整流程验证
  - Ensure all tests pass, ask the user if questions arise.
  - 运行完整流程：审计 → 修复 → 翻译 → 图片任务 → 同步 → 验收
  - 生成最终报告

## Phase 8: 迁移到主项目（人工执行）

- [ ] 15. 代码迁移准备
  - [ ] 15.1 整理迁移清单
    - 列出需要迁移的文件
    - 列出需要修改的主项目文件
    - _Requirements: 8.1_
  - [ ] 15.2 更新 package.json 命令
    - 添加 blog:audit、blog:fix、blog:translate、blog:sync 命令
    - _Requirements: 2.10, 8.6_
  - [ ] 15.3 创建迁移文档
    - 编写迁移步骤说明
    - 编写回滚方案
    - _Requirements: 8.1_

> **注意**: Phase 8 的迁移步骤需要人工审核后执行，不自动执行。
