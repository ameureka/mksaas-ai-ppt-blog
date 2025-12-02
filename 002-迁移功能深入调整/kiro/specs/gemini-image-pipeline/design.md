# Design Document: Gemini Image Pipeline

## Overview

本设计文档描述博客图片批量生成流水线的技术架构和实现方案。流水线采用四阶段设计：Prompt 生成（自动化）→ 图片生成（半自动化）→ 后处理（自动化）→ 同步部署（自动化），支持 Gemini CLI 批量生成和网页手工补充两种模式。

### 核心设计原则

1. **内容感知**: 从 MDX 文件提取内容生成 Prompt，确保图片与文章主题一致
2. **分类风格化**: 不同分类应用差异化的视觉风格
3. **半自动化**: CLI 批量处理为主，网页手工为辅
4. **状态追踪**: 通过 JSON 文件追踪每个任务的处理状态
5. **增量处理**: 支持断点续传，避免重复处理

### 代码存放规范

```
深入细化调整/006-01-博客内容创作/draft-code/
├── scripts/
│   └── image-pipeline/
│       ├── generate-prompts.ts    # Prompt 生成脚本
│       ├── batch-generate.sh      # CLI 批量生成脚本
│       ├── compress-images.sh     # 图片压缩脚本
│       ├── upload-to-s3.sh        # S3 上传脚本
│       ├── update-mdx.ts          # MDX 更新脚本
│       ├── show-progress.sh       # 进度显示脚本
│       └── check-quality.ts       # 质量检查脚本
├── config/
│   ├── category-styles.ts         # 分类风格配置
│   └── prompt-templates.ts        # Prompt 模板
├── data/
│   ├── image-tasks.json           # 任务数据
│   └── pending-prompts.md         # 待处理 Prompt
├── generated-images/              # 生成的原图
├── compressed/                    # 压缩后的图
└── logs/                          # 生成日志
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    图片生成流水线                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: Prompt 生成（自动化）                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ MDX 文件    │ -> │ Prompt      │ -> │ image-tasks │         │
│  │ (100篇)     │    │ Extractor   │    │ .json/.md   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  Phase 2: 图片生成（半自动化）                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Gemini CLI  │ -> │ 批量生成    │ -> │ 人工筛选    │         │
│  │ 脚本调用    │    │ (并行)      │    │ 质量把控    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                                      │                 │
│        v                                      v                 │
│  ┌─────────────┐                      ┌─────────────┐          │
│  │ Gemini 网页 │ <-- 失败重试 ------> │ 手工修正    │          │
│  │ (备用通道)  │                      │ (文字叠加)  │          │
│  └─────────────┘                      └─────────────┘          │
│                                                                 │
│  Phase 3: 后处理（自动化）                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ 图片压缩    │ -> │ 命名规范化  │ -> │ 状态更新    │         │
│  │ TinyPNG     │    │ {slug}-*.jpg│    │ mediaStatus │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  Phase 4: 同步部署（自动化）                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ 本地存储    │ -> │ S3/CDN 上传 │ -> │ MDX 更新    │         │
│  │ public/     │    │ aws s3 sync │    │ frontmatter │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### ImageTask 数据结构

```typescript
interface ImageTask {
  slug: string;
  title: string;
  category: string;
  styleHint: string;
  palette: string;

  cover: {
    filename: string;
    prompt: string;
    textStrategy: 'short-zh' | 'english' | 'blank';
    textToRender: string;
    status: 'pending' | 'generated' | 'approved' | 'uploaded';
  };

  inlineImages: Array<{
    filename: string;
    scene: string;
    prompt: string;
    status: 'pending' | 'generated' | 'approved' | 'uploaded';
  }>;

  mediaStatus: 'none' | 'partial' | 'done';
  createdAt: string;
  updatedAt: string;
}
```

### CategoryStyle 配置

```typescript
interface CategoryStyle {
  category: string;
  styleHint: string;
  palette: string;
  sceneElements: string[];
}

const categoryStyles: CategoryStyle[] = [
  {
    category: '商务汇报',
    styleHint: '极简网格、数据卡片、科技光影',
    palette: '深蓝/灰',
    sceneElements: ['数据看板', '折线图', '演讲人+大屏'],
  },
  {
    category: '年终总结',
    styleHint: '时间线+图表、稳重',
    palette: '暖色/中性',
    sceneElements: ['时间线', '成就卡片', '数据对比'],
  },
  {
    category: '教育培训',
    styleHint: '插画人物、卡片分组',
    palette: '明快、高对比',
    sceneElements: ['课堂场景', '步骤图', '互动元素'],
  },
  {
    category: '产品营销',
    styleHint: '大标题、渐变/霓虹、情境 mock',
    palette: '高对比',
    sceneElements: ['产品展示', '营销漏斗', '用户场景'],
  },
  // ... 其他分类
];
```

## Component Design

### Component 1: Prompt Extractor

**职责**: 从 MDX 文件提取内容并生成结构化 Prompt

**输入**:
- MDX 文件路径
- 分类风格配置

**输出**:
- ImageTask 对象

**核心逻辑**:

```typescript
// scripts/image-pipeline/generate-prompts.ts

import * as fs from 'fs';
import matter from 'gray-matter';
import { categoryStyles } from '../config/category-styles';

interface PromptExtractorOptions {
  mdxPath: string;
  outputPath: string;
}

async function extractPrompts(options: PromptExtractorOptions): Promise<ImageTask[]> {
  const tasks: ImageTask[] = [];
  const mdxFiles = glob.sync(`${options.mdxPath}/**/*.zh.mdx`);

  for (const file of mdxFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const { data, content: body } = matter(content);

    const slug = path.basename(file, '.zh.mdx');
    const category = data.categories?.[0] || '通用';
    const style = categoryStyles.find(s => s.category === category) || categoryStyles[0];

    // 提取 H2/H3 标题作为场景
    const scenes = extractScenes(body);

    // 生成封面 Prompt
    const coverPrompt = generateCoverPrompt({
      title: data.title,
      keywords: data.seoKeywords || [],
      style,
      textStrategy: selectTextStrategy(data.title),
    });

    // 生成内页 Prompt
    const inlinePrompts = scenes.slice(0, 4).map((scene, i) => ({
      filename: `${slug}-${i + 1}.png`,
      scene,
      prompt: generateInlinePrompt({ scene, style }),
      status: 'pending' as const,
    }));

    tasks.push({
      slug,
      title: data.title,
      category,
      styleHint: style.styleHint,
      palette: style.palette,
      cover: {
        filename: `${slug}-cover.jpg`,
        prompt: coverPrompt,
        textStrategy: selectTextStrategy(data.title),
        textToRender: extractCoreKeywords(data.title),
        status: 'pending',
      },
      inlineImages: inlinePrompts,
      mediaStatus: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return tasks;
}

function selectTextStrategy(title: string): 'short-zh' | 'english' | 'blank' {
  if (title.length <= 6) return 'short-zh';
  return 'short-zh'; // 默认提取短关键词
}

function extractCoreKeywords(title: string): string {
  // 提取 2-6 字核心关键词
  const keywords = title.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  return keywords[0] || title.slice(0, 6);
}
```

### Component 2: Prompt Templates

**职责**: 提供标准化的 Prompt 模板

```typescript
// config/prompt-templates.ts

export const coverPromptTemplate = `
你是专业平面设计师，请生成 1200x630 的博客封面图，风格 {styleHint}。
主题：{title}
关键词：{keywords}
需包含的文字：{textToRender}
画面元素：{sceneElements}
颜色：{palette}
构图：简洁、可读性高，避免过度细节；背景干净以便叠字。
输出：无水印，无多余文字，高清。
`;

export const inlinePromptTemplate = `
生成 1000x600 的信息图/情景图，风格 {styleHint}。
场景：{scene}
画面元素：{elements}
颜色：{palette}
要求：清晰、简洁、无水印，文字极少（仅短标签），适合博客正文插图。
`;
```

### Component 3: Batch Generator (Shell)

**职责**: 批量调用 Gemini CLI 生成图片

```bash
#!/bin/bash
# scripts/image-pipeline/batch-generate.sh

TASKS_FILE="data/image-tasks.json"
OUTPUT_DIR="generated-images"
LOG_DIR="logs"

mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# 读取 pending 任务
jq -c '.[] | select(.cover.status == "pending")' "$TASKS_FILE" | while read task; do
  slug=$(echo "$task" | jq -r '.slug')
  cover_prompt=$(echo "$task" | jq -r '.cover.prompt')

  echo "🎨 生成封面: $slug"

  # 调用 Gemini CLI
  gemini generate-image \
    --prompt "$cover_prompt" \
    --output "$OUTPUT_DIR/${slug}-cover.jpg" \
    --size "1200x630" \
    2>&1 | tee -a "$LOG_DIR/${slug}.log"

  # 检查结果并更新状态
  if [ -f "$OUTPUT_DIR/${slug}-cover.jpg" ]; then
    echo "✅ 封面生成成功: $slug"
    # 更新 JSON 状态（使用 jq）
    jq --arg slug "$slug" \
       '(.[] | select(.slug == $slug) | .cover.status) = "generated"' \
       "$TASKS_FILE" > tmp.json && mv tmp.json "$TASKS_FILE"
  else
    echo "❌ 封面生成失败: $slug"
  fi

  # 生成内页图片
  echo "$task" | jq -c '.inlineImages[] | select(.status == "pending")' | while read inline; do
    filename=$(echo "$inline" | jq -r '.filename')
    prompt=$(echo "$inline" | jq -r '.prompt')

    gemini generate-image \
      --prompt "$prompt" \
      --output "$OUTPUT_DIR/$filename" \
      --size "1000x600" \
      2>&1 | tee -a "$LOG_DIR/${slug}.log"
  done

  # 避免 rate limit
  sleep 3
done

echo "📊 批量生成完成"
```

### Component 4: Image Compressor

**职责**: 压缩和规范化图片

```bash
#!/bin/bash
# scripts/image-pipeline/compress-images.sh

INPUT_DIR="generated-images"
OUTPUT_DIR="compressed"

mkdir -p "$OUTPUT_DIR"

# 压缩 JPG（封面）
for img in "$INPUT_DIR"/*-cover.jpg; do
  [ -f "$img" ] || continue
  filename=$(basename "$img")
  convert "$img" -quality 85 -resize "1200x630>" "$OUTPUT_DIR/$filename"
  echo "✅ 压缩: $filename"
done

# 压缩 PNG（内页）
for img in "$INPUT_DIR"/*.png; do
  [ -f "$img" ] || continue
  filename=$(basename "$img")
  pngquant --quality=65-80 --output "$OUTPUT_DIR/$filename" "$img" 2>/dev/null || \
    cp "$img" "$OUTPUT_DIR/$filename"
  echo "✅ 压缩: $filename"
done

# 规范化命名（小写、连字符）
for file in "$OUTPUT_DIR"/*; do
  newname=$(echo "$file" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  [ "$file" != "$newname" ] && mv "$file" "$newname"
done

echo "📦 压缩完成"
```

### Component 5: S3 Uploader

**职责**: 同步图片到 S3/CDN

```bash
#!/bin/bash
# scripts/image-pipeline/upload-to-s3.sh

LOCAL_DIR="public/images/blog"
S3_BUCKET="${STORAGE_BUCKET_NAME}"
S3_PREFIX="public/images/blog"

# 从 compressed 复制到 public
cp compressed/* "$LOCAL_DIR/"

# 同步到 S3
aws s3 sync "$LOCAL_DIR/" "s3://${S3_BUCKET}/${S3_PREFIX}/" \
  --acl public-read \
  --cache-control "max-age=31536000" \
  --exclude "*.DS_Store"

# 更新状态
jq '.[].cover.status = "uploaded" | .[].inlineImages[].status = "uploaded"' \
  data/image-tasks.json > tmp.json && mv tmp.json data/image-tasks.json

echo "☁️ S3 上传完成"
```

### Component 6: MDX Updater

**职责**: 更新 MDX 文件中的图片路径

```typescript
// scripts/image-pipeline/update-mdx.ts

import * as fs from 'fs';
import matter from 'gray-matter';

async function updateMdxImages(tasksPath: string, mdxDir: string) {
  const tasks: ImageTask[] = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  for (const task of tasks) {
    const mdxPath = `${mdxDir}/${task.slug}.zh.mdx`;
    if (!fs.existsSync(mdxPath)) continue;

    let content = fs.readFileSync(mdxPath, 'utf-8');
    const { data, content: body } = matter(content);

    // 更新封面图
    data.image = `/images/blog/${task.cover.filename}`;

    // 更新正文图片（替换占位符）
    let newBody = body;
    task.inlineImages.forEach((img, i) => {
      const placeholder = new RegExp(`!\\[placeholder-${i + 1}\\]`, 'g');
      const replacement = `![${img.scene}](/images/blog/${img.filename})`;
      newBody = newBody.replace(placeholder, replacement);
    });

    fs.writeFileSync(mdxPath, matter.stringify(newBody, data));
    console.log(`✅ 更新: ${task.slug}`);
  }
}
```

### Component 7: Progress Reporter

**职责**: 显示生成进度统计

```bash
#!/bin/bash
# scripts/image-pipeline/show-progress.sh

TASKS_FILE="data/image-tasks.json"

echo "📊 图片生成进度"
echo "================"

total=$(jq 'length' "$TASKS_FILE")
cover_done=$(jq '[.[] | select(.cover.status == "approved" or .cover.status == "uploaded")] | length' "$TASKS_FILE")
inline_done=$(jq '[.[].inlineImages[] | select(.status == "approved" or .status == "uploaded")] | length' "$TASKS_FILE")
total_inline=$((total * 3))

echo "封面: $cover_done / $total ($(( cover_done * 100 / total ))%)"
echo "内页: $inline_done / $total_inline ($(( inline_done * 100 / total_inline ))%)"
echo ""
echo "状态分布:"
jq -r 'group_by(.mediaStatus) | .[] | "\(.[0].mediaStatus): \(length)"' "$TASKS_FILE"
```

## Error Handling

### 失败重试策略

```typescript
const retryConfig = {
  maxRetries: 3,
  strategies: [
    'simplify-prompt',      // 简化 Prompt
    'change-text-strategy', // 改用英文/留白
    'manual-web',           // 切换到网页手工
  ],
};
```

### 错误类型处理

| 错误类型 | 处理方式 |
|---------|---------|
| Rate Limit | 等待 60 秒后重试 |
| Prompt 被拒 | 简化 Prompt 重试 |
| 文字渲染失败 | 切换到留白策略 |
| 网络超时 | 重试 3 次后标记失败 |
| 多次失败 | 导出到 pending-prompts.md 手工处理 |

## Testing Strategy

### 单元测试

- Prompt 生成逻辑测试
- 文字策略选择测试
- 状态更新逻辑测试

### 集成测试

- 端到端流水线测试（使用 mock Gemini CLI）
- S3 上传测试（使用 localstack）

### 人工验收

- 每分类抽检 2-3 张图片
- 检查文字清晰度、风格一致性、尺寸合规性
