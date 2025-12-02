# Tasks: Gemini Image Pipeline

## Task 1: 创建项目目录结构

### Description
创建图片流水线所需的目录结构和基础配置文件。

### Acceptance Criteria
- [ ] 创建 `draft-code/scripts/image-pipeline/` 目录
- [ ] 创建 `draft-code/config/` 目录
- [ ] 创建 `draft-code/data/` 目录
- [ ] 创建 `draft-code/generated-images/` 目录
- [ ] 创建 `draft-code/compressed/` 目录
- [ ] 创建 `draft-code/logs/` 目录
- [ ] 创建 README.md 使用说明

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/README.md`

---

## Task 2: 实现分类风格配置

### Description
创建分类到视觉风格的映射配置文件。

### Acceptance Criteria
- [ ] 定义 CategoryStyle 接口
- [ ] 配置 10 个分类的 styleHint、palette、sceneElements
- [ ] 导出 categoryStyles 数组
- [ ] 添加 getCategoryStyle(category) 辅助函数

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/config/category-styles.ts`

### Implementation Details
```typescript
export interface CategoryStyle {
  category: string;
  categoryEn: string;
  styleHint: string;
  palette: string;
  sceneElements: string[];
}

export const categoryStyles: CategoryStyle[] = [
  {
    category: '商务汇报',
    categoryEn: 'business',
    styleHint: '极简网格、数据卡片、科技光影',
    palette: '深蓝/灰',
    sceneElements: ['数据看板', '折线图', '演讲人+大屏'],
  },
  // ... 其他 9 个分类
];
```

---

## Task 3: 实现 Prompt 模板

### Description
创建封面和内页的 Prompt 模板及生成函数。

### Acceptance Criteria
- [ ] 定义封面 Prompt 模板
- [ ] 定义内页 Prompt 模板
- [ ] 实现 generateCoverPrompt() 函数
- [ ] 实现 generateInlinePrompt() 函数
- [ ] 支持变量替换

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/config/prompt-templates.ts`

---

## Task 4: 实现 ImageTask 数据模型

### Description
定义图片任务的 TypeScript 类型和验证逻辑。

### Acceptance Criteria
- [ ] 定义 ImageTask 接口
- [ ] 定义 CoverTask 接口
- [ ] 定义 InlineImageTask 接口
- [ ] 定义 MediaStatus 类型
- [ ] 定义 TaskStatus 类型
- [ ] 实现 validateImageTask() 函数

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/types.ts`

---

## Task 5: 实现 Prompt Extractor 脚本

### Description
从 MDX 文件提取内容并生成结构化 Prompt。

### Acceptance Criteria
- [ ] 扫描指定目录下的 .zh.mdx 文件
- [ ] 解析 frontmatter 提取 title、description、categories
- [ ] 提取正文 H2/H3 标题作为场景候选
- [ ] 根据分类应用对应风格
- [ ] 选择合适的文字渲染策略
- [ ] 生成 image-tasks.json 输出
- [ ] 生成 image-tasks.md 可读清单

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/generate-prompts.ts`

### Implementation Details
```typescript
// 核心函数签名
async function generatePrompts(options: {
  mdxDir: string;
  outputDir: string;
}): Promise<void>;

function extractScenes(body: string): string[];
function selectTextStrategy(title: string): TextStrategy;
function extractCoreKeywords(title: string): string;
```

---

## Task 6: 实现文字策略选择逻辑

### Description
实现中文文字渲染策略的自动选择逻辑。

### Acceptance Criteria
- [ ] 标题 ≤6 字时使用 short-zh 策略
- [ ] 标题 >6 字时提取 2-6 字核心关键词
- [ ] 支持手动指定 english 策略
- [ ] 支持手动指定 blank 策略
- [ ] 输出 textToRender 字段

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/text-strategy.ts`

---

## Task 7: 实现 Gemini CLI 批量生成脚本

### Description
创建调用 Gemini CLI 批量生成图片的 Shell 脚本。

### Acceptance Criteria
- [ ] 读取 image-tasks.json 中 pending 状态的任务
- [ ] 调用 gemini generate-image 命令
- [ ] 封面使用 1200x630 尺寸
- [ ] 内页使用 1000x600 尺寸
- [ ] 生成成功后更新状态为 generated
- [ ] 生成失败后记录日志
- [ ] 每次生成后等待 3 秒避免限流

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/batch-generate.sh`

---

## Task 8: 实现网页手工生成支持

### Description
生成供网页手工生成使用的 Prompt 清单。

### Acceptance Criteria
- [ ] 导出所有 pending 状态的 Prompt 到 pending-prompts.md
- [ ] 使用 Markdown 代码块格式化 Prompt
- [ ] 包含文件命名规范提示
- [ ] 按分类分组显示
- [ ] 实现 mark-complete 命令更新状态

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/export-pending.ts`
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/mark-complete.ts`

---

## Task 9: 实现图片压缩脚本

### Description
创建图片压缩和规范化的 Shell 脚本。

### Acceptance Criteria
- [ ] JPG 使用 quality=85 压缩至 <200KB
- [ ] PNG 使用 pngquant quality=65-80 压缩至 <150KB
- [ ] 文件名转小写、连字符分隔
- [ ] 封面命名为 {slug}-cover.jpg
- [ ] 内页命名为 {slug}-{n}.png

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/compress-images.sh`

---

## Task 10: 实现状态追踪与更新

### Description
实现图片任务状态的追踪和更新逻辑。

### Acceptance Criteria
- [ ] 支持 pending/generated/approved/uploaded 四种状态
- [ ] 更新单个任务的封面状态
- [ ] 更新单个任务的内页状态
- [ ] 计算整体 mediaStatus（none/partial/done）
- [ ] 持久化状态到 image-tasks.json

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/update-status.ts`

---

## Task 11: 实现进度显示脚本

### Description
创建显示生成进度统计的脚本。

### Acceptance Criteria
- [ ] 显示封面完成数/总数和百分比
- [ ] 显示内页完成数/总数和百分比
- [ ] 显示各状态的任务数量分布
- [ ] 显示各分类的完成情况

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/show-progress.sh`

---

## Task 12: 实现 S3 上传脚本

### Description
创建同步图片到 S3/CDN 的脚本。

### Acceptance Criteria
- [ ] 从 compressed 复制到 public/images/blog/
- [ ] 使用 aws s3 sync 上传到 S3
- [ ] 设置 Cache-Control: max-age=31536000
- [ ] 设置 ACL 为 public-read
- [ ] 上传完成后更新状态为 uploaded

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/upload-to-s3.sh`

---

## Task 13: 实现 MDX 更新脚本

### Description
创建更新 MDX 文件中图片路径的脚本。

### Acceptance Criteria
- [ ] 更新 frontmatter.image 为封面路径
- [ ] 替换正文中的 ![placeholder-{n}] 占位符
- [ ] 使用场景描述作为 alt 文本
- [ ] 保持其他 frontmatter 字段不变

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/update-mdx.ts`

---

## Task 14: 实现质量检查脚本

### Description
创建图片质量检查脚本。

### Acceptance Criteria
- [ ] 检查封面尺寸为 1200x630
- [ ] 检查内页尺寸为 1000x600
- [ ] 检查封面文件大小 <200KB
- [ ] 检查内页文件大小 <150KB
- [ ] 检查每篇文章有 1 封面 + ≥3 内页
- [ ] 输出检查报告

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/scripts/image-pipeline/check-quality.ts`

---

## Task 15: 添加 package.json 命令

### Description
在 package.json 中添加图片流水线相关命令。

### Acceptance Criteria
- [ ] 添加 `image:prompts` 命令
- [ ] 添加 `image:generate` 命令
- [ ] 添加 `image:compress` 命令
- [ ] 添加 `image:upload` 命令
- [ ] 添加 `image:update-mdx` 命令
- [ ] 添加 `image:progress` 命令
- [ ] 添加 `image:check` 命令

### Files to Create/Modify
- `package.json`

### Implementation Details
```json
{
  "scripts": {
    "image:prompts": "tsx scripts/image-pipeline/generate-prompts.ts",
    "image:generate": "bash scripts/image-pipeline/batch-generate.sh",
    "image:compress": "bash scripts/image-pipeline/compress-images.sh",
    "image:upload": "bash scripts/image-pipeline/upload-to-s3.sh",
    "image:update-mdx": "tsx scripts/image-pipeline/update-mdx.ts",
    "image:progress": "bash scripts/image-pipeline/show-progress.sh",
    "image:check": "tsx scripts/image-pipeline/check-quality.ts"
  }
}
```

---

## Task 16: 编写使用文档

### Description
编写图片流水线的使用说明文档。

### Acceptance Criteria
- [ ] 说明前置依赖（Gemini CLI、ImageMagick、pngquant、aws-cli）
- [ ] 说明环境变量配置
- [ ] 说明完整执行流程
- [ ] 说明手工生成流程
- [ ] 说明常见问题处理

### Files to Create/Modify
- `深入细化调整/006-01-博客内容创作/draft-code/README.md`

---

## Task 17: 迁移脚本到主项目

### Description
将验证通过的脚本迁移到主项目 scripts 目录。

### Acceptance Criteria
- [ ] 所有测试通过
- [ ] 代码风格符合 Biome 规范
- [ ] 类型定义完整
- [ ] 迁移到 scripts/image-pipeline/
- [ ] 更新 package.json 命令路径

### Files to Create/Modify
- `scripts/image-pipeline/*`
- `package.json`

---

## Task 18: 端到端测试

### Description
执行完整的端到端测试验证流水线功能。

### Acceptance Criteria
- [ ] 选取 5 篇测试文章
- [ ] 执行 Prompt 生成
- [ ] 执行图片生成（或 mock）
- [ ] 执行压缩和上传
- [ ] 执行 MDX 更新
- [ ] 验证最终结果

---

## Task Dependencies

```
Task 1 (目录结构)
    ↓
Task 2 (分类配置) → Task 3 (Prompt 模板) → Task 4 (数据模型)
    ↓                    ↓                      ↓
    └────────────────────┴──────────────────────┘
                         ↓
Task 5 (Prompt Extractor) ← Task 6 (文字策略)
    ↓
Task 7 (CLI 批量生成) → Task 8 (网页手工支持)
    ↓
Task 9 (图片压缩) → Task 10 (状态追踪) → Task 11 (进度显示)
    ↓
Task 12 (S3 上传) → Task 13 (MDX 更新)
    ↓
Task 14 (质量检查)
    ↓
Task 15 (package.json) → Task 16 (文档)
    ↓
Task 17 (迁移) → Task 18 (端到端测试)
```

## Execution Order

### Phase 1: 基础设施 (Day 1)
1. Task 1: 创建目录结构
2. Task 2: 分类风格配置
3. Task 3: Prompt 模板
4. Task 4: 数据模型

### Phase 2: Prompt 生成 (Day 2)
5. Task 5: Prompt Extractor
6. Task 6: 文字策略

### Phase 3: 图片生成 (Day 3-4)
7. Task 7: CLI 批量生成
8. Task 8: 网页手工支持
9. Task 10: 状态追踪
10. Task 11: 进度显示

### Phase 4: 后处理 (Day 5)
11. Task 9: 图片压缩
12. Task 12: S3 上传
13. Task 13: MDX 更新
14. Task 14: 质量检查

### Phase 5: 集成与测试 (Day 6)
15. Task 15: package.json 命令
16. Task 16: 使用文档
17. Task 17: 迁移脚本
18. Task 18: 端到端测试
