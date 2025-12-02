# Gemini 图片生成流水线

为 100 篇博文批量生成封面和内页配图的半自动化流水线。

## 前置依赖

```bash
# 必需
brew install jq          # JSON 处理

# 可选（用于压缩）
brew install imagemagick # 图片处理
brew install pngquant    # PNG 压缩

# 可选（用于 S3 上传）
brew install awscli      # AWS CLI
```

## 快速开始

### 1. 生成 Prompt

```bash
npx tsx scripts/image-pipeline/generate-prompts.ts
```

输出:
- `data/image-tasks.json` - 结构化任务数据
- `data/image-tasks.md` - 可读的 Prompt 清单

### 2. 生成图片

**方式 A: Gemini CLI 批量生成**

```bash
bash scripts/image-pipeline/batch-generate.sh --all
```

**方式 B: 网页手工生成**

```bash
# 导出待处理清单
npx tsx scripts/image-pipeline/export-pending.ts

# 打开 data/pending-prompts.md，复制 Prompt 到 Gemini 网页
# 下载图片到 generated-images/ 目录

# 扫描并标记完成
npx tsx scripts/image-pipeline/mark-complete.ts --scan
```

### 3. 压缩图片

```bash
bash scripts/image-pipeline/compress-images.sh
```

### 4. 上传到 S3

```bash
bash scripts/image-pipeline/upload-to-s3.sh
```

### 5. 更新 MDX 文件

```bash
# 预览模式
npx tsx scripts/image-pipeline/update-mdx.ts --dry-run

# 实际执行
npx tsx scripts/image-pipeline/update-mdx.ts
```

### 6. 查看进度

```bash
npx tsx scripts/image-pipeline/show-progress.ts
```

### 7. 质量检查

```bash
npx tsx scripts/image-pipeline/check-quality.ts
```

## 目录结构

```
draft-code/
├── scripts/image-pipeline/
│   ├── generate-prompts.ts   # Prompt 生成
│   ├── batch-generate.sh     # CLI 批量生成
│   ├── export-pending.ts     # 导出待处理清单
│   ├── mark-complete.ts      # 标记完成
│   ├── compress-images.sh    # 图片压缩
│   ├── upload-to-s3.sh       # S3 上传
│   ├── update-mdx.ts         # MDX 更新
│   ├── show-progress.ts      # 进度显示
│   ├── check-quality.ts      # 质量检查
│   └── types.ts              # 类型定义
├── config/
│   ├── category-styles.ts    # 分类风格配置
│   └── prompt-templates.ts   # Prompt 模板
├── data/
│   ├── image-tasks.json      # 任务数据
│   ├── image-tasks.md        # Prompt 清单
│   └── pending-prompts.md    # 待处理清单
├── generated-images/         # 生成的原图
├── compressed/               # 压缩后的图
└── logs/                     # 生成日志
```

## 文件命名规范

| 类型 | 格式 | 尺寸 | 大小限制 |
|------|------|------|----------|
| 封面 | `{slug}-cover.jpg` | 1200x630 | <200KB |
| 内页 | `{slug}-{n}.png` | 1000x600 | <150KB |

## 任务状态

- `pending` - 待处理
- `generated` - 已生成
- `approved` - 已审核
- `uploaded` - 已上传

## 分类风格

| 分类 | 风格 | 配色 |
|------|------|------|
| 商务汇报 | 极简网格、科技光影 | 深蓝/灰 |
| 年终总结 | 时间线、稳重 | 暖橙/金 |
| 教育培训 | 插画人物、卡片 | 绿/蓝/黄 |
| 产品营销 | 渐变霓虹、情境 | 粉/紫/青 |
| 项目提案 | 创新、前瞻 | 蓝/绿 |
| 述职报告 | 专业、稳重 | 深灰/石墨 |
| 通用技巧 | 信息图、实用 | 蓝/绿/黄 |
| 付费搜索 | 现代、资源导向 | 紫/粉/青 |

## 常见问题

### Q: Gemini CLI 未安装怎么办？

使用网页手工生成模式：
1. 运行 `export-pending.ts` 导出 Prompt
2. 复制到 Gemini 网页生成
3. 运行 `mark-complete.ts --scan` 更新状态

### Q: 图片文件过大怎么办？

运行压缩脚本：
```bash
bash scripts/image-pipeline/compress-images.sh
```

### Q: 如何只处理特定分类？

编辑 `generate-prompts.ts` 中的过滤逻辑，或手动编辑 `image-tasks.json`。

## 相关文档

- [需求文档](/.kiro/specs/gemini-image-pipeline/requirements.md)
- [设计文档](/.kiro/specs/gemini-image-pipeline/design.md)
- [任务列表](/.kiro/specs/gemini-image-pipeline/tasks.md)
