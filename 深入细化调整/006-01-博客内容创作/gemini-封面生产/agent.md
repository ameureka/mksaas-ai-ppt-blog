## Gemini 封面生产方案 - 完整学习总结

### 📋 核心目标

为 100 篇博文批量生成：
- **封面图**：1200x630，含标题文字，<200KB
- **内页配图**：3-4 张/篇，1000x600，情景化，<150KB

### 🏗️ 四阶段流水线架构

Phase 1: Prompt 生成（自动化）
   MDX 文件 → Prompt Extractor → image-tasks.json

Phase 2: 图片生成（半自动）
   Gemini CLI/网页 → 批量生成 → 人工筛选

Phase 3: 后处理（自动化）
   压缩 → 命名规范化 → 状态更新

Phase 4: 同步部署（自动化）
   本地存储 → S3/CDN 上传 → MDX frontmatter 更新


### 📁 文件命名规范

| 类型 | 路径 | 尺寸 | 大小 |
|------|------|------|------|
| 封面 | /images/blog/{slug}-cover.jpg | 1200x630 | <200KB |
| 内页 | /images/blog/{slug}-{n}.png | 1000x600 | <150KB |

### 🎨 分类风格速查

| 分类 | 风格 | 配色 |
|------|------|------|
| 商务汇报/项目提案 | 极简网格、数据卡片、科技光影 | 深蓝/灰 |
| 年终总结/述职 | 时间线+图表、稳重 | 暖色/中性 |
| 教育培训 | 插画人物、卡片分组 | 明快、高对比 |
| 产品营销 | 大标题、渐变/霓虹、情境 mock | 高对比 |

### ⚠️ 中文文字渲染策略（关键）

AI 渲染长中文容易出错，三种解决方案：

| 策略 | 做法 | 适用场景 |
|------|------|----------|
| A: 短词 | 只渲染 2-6 字核心词（如"产品营销"） | 成功率高 |
| B: 英文 | 用英文标题，中文后期叠加 | 英文版封面 |
| C: 留白 | 生成无文字画面，后期加字 | 最灵活 |

### 📝 Prompt 模板

封面 Prompt：
你是专业平面设计师，请生成 1200x630 的博客封面图，风格 {style_hint}。
主题：{title}
关键词：{keywords}
需包含的文字：{text_to_render}  // 短中文或"留出中央空白供叠字"
画面元素：{scene_elements}
颜色：{palette}
构图：简洁、可读性高，避免过度细节；背景干净以便叠字。
输出：无水印，无多余文字，高清。


内页 Prompt：
生成 1000x600 的信息图/情景图，风格 {style_hint}。
场景：{scene}  // 如"市场分析流程示意"
画面元素：{elements}
颜色：{palette}
要求：清晰、简洁、无水印，文字极少，适合博客正文插图。


### 🔧 核心数据结构

typescript
interface ImageTask {
  slug: string;
  title: string;
  category: string;

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
}


### 🚀 手工执行流程（无 API）

1. 生成 Prompt 清单：运行脚本扫描 MDX → 输出 image-tasks.md
2. 逐篇生成：
   - 复制封面 Prompt → 粘贴到 Gemini → 下载命名 {slug}-cover.jpg
   - 复制内页 Prompt → 生成 3 张 {slug}-1.png 等
3. 压缩：TinyPNG/Squoosh 压缩
4. 落盘：放入 public/images/blog/
5. 更新 MDX：frontmatter image 指向 cover，正文插入配图
6. 上传 S3：aws s3 sync public/images/blog/ s3://bucket/...
7. 验证：pnpm blog:audit 确认 no_cover/few_images 清零

### 📊 进度追踪表格示例

markdown
| slug | title | category | style | cover_done | inline_done | uploaded |
|------|-------|----------|-------|------------|-------------|----------|
| ppt-guide | 8大PPT分类指南 | tutorial | 明快+信息图 | N | 0/3 | N |


### 💡 效率技巧

- 一次复制 3-5 条 Prompt 到 Gemini 对话，逐张出图
- 先跑同一分类的全量封面，保持系列感
- 生成后立刻压缩、命名、落盘，避免堆积
- 失败时：简化 Prompt → 改文字策略 → 手工网页重试

### 🔄 失败重试策略

CLI 失败 → 网页手工
网页失败 → 调整 Prompt 重试
多次失败 → 使用占位图，标记 mediaStatus=partial


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


需要我帮你实现其中的某个脚本（如 Prompt Extractor 或批量生成脚本）吗？
 ▸ Credits: 1.44 • Time: 44s
