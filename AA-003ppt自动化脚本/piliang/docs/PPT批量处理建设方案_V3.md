# PPT 批量处理与智能化工厂建设方案 (V3.0)

> **修订记录**:
> - V3.0: 深化 **AI 内容理解 (车间 C)** 的实现路径，确定为 **"Python 生成 Prompt -> Agent/CLI 执行 -> Python 回填"** 的文件交换模式。
> - V2.0: 基于解剖调研修正去水印和品牌注入策略。
> - V1.0: 初始草案。

## 1. 项目背景与目标
本项目旨在建立一条自动化的数据生产流水线 (Pipeline)，将爬虫采集到的原始 PPT 模板资源转化为**标准化、无品牌痕迹、高价值**的成品资源。
重点在于**品牌重塑 (Rebranding)** 至 **PPTHub** (`https://www.ppthub.shop/`)，并通过异步 AI 处理流程提取深层元数据，构建高质量的向量检索库。

## 2. 技术路线选型 (Tech Stack)

*   **核心语言**: **Python 3.10+**
*   **PPT 操作**: **`python-pptx`** (深度清洗与页面重构)
*   **AI 交互**: **File-based Prompting** (异步模式) - 利用 Gemini CLI 处理预生成的 Prompt 文件，规避 API 依赖。
*   **数据管理**: `sqlite3`, `pandas`

## 3. 核心处理流程 (Pipeline Design)

### 车间 A：预处理 (ETL)
1.  **输入**: 链接至 `pachong/downloads`。
2.  **解压**: 提取主 `.pptx` 文件，丢弃说明文档和 URL 快捷方式。
3.  **标准化**: 重命名为 `{aid}-{title}.pptx`。
4.  **封面**: 迁移并重命名封面图片至 `output/{channel}/images/`。

### 车间 B：深度清洗 (Deep Cleaning)

#### 1. 全局文本清洗
*   **替换规则**:
    *   `"第一PPT"` / `"1ppt"` -> **删除** 或替换为 `"PPTHub"`.
    *   `"www.1ppt.com"` -> **替换** 为 `"www.ppthub.shop"`.
*   **元数据重置**:
    *   `Title`: `{title} - PPTHub`
    *   `Author`: `PPTHub`
    *   `Company`: `PPTHub Inc.`
    *   `Comments`: `Download more at https://www.ppthub.shop/`

#### 2. 页面手术
*   **首页 (P1)**: 注入 `Presented by PPTHub` (若有空缺副标题)。
*   **尾部处理**: **强制删除倒数后 3 页**，并向前扫描直至无敏感词。
*   **品牌注入**: 插入 **1 页** `brand_end_slide.pptx` ("THANKS", "感谢您的观看", "https://www.ppthub.shop/")。

### 车间 C：AI 内容理解 (AI Enrichment) - *异步文件交换模式*

此环节不阻塞清洗流程，可独立运行。

#### 步骤 1: 任务生成 (Generator)
*   Python 脚本遍历已清洗的 PPT。
*   提取 **Title**, **Tags** (DB), **Directory Text** (目录页文本)。
*   生成 `ai_tasks/pending/{aid}.md` Prompt 文件。
    *   *Prompt 目标*: 忽略英文占位符，基于标题和标签生成 **Summary**, **Keywords**, **Scenario**, **Color Scheme** (JSON 格式)。

#### 步骤 2: 批量执行 (Executor)
*   **操作者**: 用户 (通过 CLI Agent) 或 Shell 脚本。
*   **动作**: 读取 `pending/*.md`，调用 Gemini 模型，将输出结果保存至 `ai_tasks/completed/{aid}.json`。

#### 步骤 3: 数据回填 (Backfiller)
*   Python 脚本扫描 `completed/*.json`。
*   校验 JSON 格式。
*   更新数据库 `processed_assets` 表。
*   **构建向量文本**: `embedding_text = f"{title} {summary} {keywords} {scenario}"`。

### 车间 D：成品输出
*   **文件**: 存入 `output/{channel_id}/` (含清洗后 PPT 和封面)。
*   **数据**: SQLite 数据库包含完整的清洗状态和 AI 增强元数据。

## 4. 目录结构规划

```text
piliang/
├── docs/
├── src/
│   ├── scripts/
│   │   ├── cleaner.py       # 清洗逻辑
│   │   ├── ai_generator.py  # 生成 Prompt 文件 (Step 1)
│   │   ├── ai_backfiller.py # 回填数据库 (Step 3)
│   │   └── pipeline.py      # 主调度
│   ├── templates/
│   │   └── brand_end_slide.pptx
│   └── ai_tasks/            # AI 任务队列
│       ├── pending/         # 待处理 .md
│       └── completed/       # 已完成 .json
├── input_link/          # -> ../pachong/downloads
├── output/              # 最终产物
└── requirements.txt
```

## 5. 关键决策点确认
*   [x] **尾部处理**: 确认倒数 3 页策略。
*   [x] **品牌注入**: 确认 PPTHub 品牌及网址替换策略。
*   [x] **AI 模式**: 确认 **Prompt文件交换** 模式，解耦 Python 与 AI 环境。
