# PPT 批量处理与智能化工厂建设方案 (V1.0)

## 1. 项目背景与目标
本项目旨在建立一条自动化的数据生产流水线 (Pipeline)，将爬虫采集到的原始 PPT 模板资源转化为**标准化、无品牌痕迹、高价值**的成品资源，并结合 AI 技术提取深层元数据，为后续的向量化搜索和 SaaS 平台应用奠定基础。

## 2. 技术路线选型 (Tech Stack)

*   **核心语言**: **Python 3.10+** (利用其强大的数据处理和 AI 生态)
*   **PPT 操作库**: **`python-pptx`** (业界标准，支持读写 slide、shape、text、layout、master)
*   **压缩包处理**: **`zipfile` / `rarfile`**
*   **数据管理**: **`sqlite3`** (读取爬虫 DB) + **`pandas`**
*   **AI 能力**: **LLM API** (OpenAI/Claude/Gemini) + **`langchain`** (可选)

## 3. 核心处理流程 (Pipeline Design)

### 车间 A：预处理 (ETL & Normalization)
1.  **输入源**: 链接至 `pachong/downloads` 目录。
2.  **解压清洗**: 解压 .zip/.rar，剔除垃圾文件（如 `使用说明.txt`, `链接.url`）。
3.  **标准化重命名**: 基于数据库 `aid` 和 `title`，统一重命名为 `{aid}-{title}.pptx`。
4.  **封面同步**: 确保 `images/{aid}-cover.jpg` 同步迁移至输出目录。

### 车间 B：深度清洗 (Deep Cleaning)
1.  **全局文本替换**:
    *   遍历 Slide、Shape、Table、Notes。
    *   查找并替换/删除关键词：`"第一PPT"`, `"1ppt"`, `"第一PPT模板网"` 等。
    *   清除文件元数据 (`Core Properties`: 作者、公司、备注)。
2.  **母版处理**:
    *   扫描 `slide_masters`，清除母版中的 Logo 图片或品牌水印文字。
3.  **页面手术**:
    *   **首页 (P1)**: 清洗标题/副标题中的敏感词。
    *   **第二页 (P2)**: 启发式检测。若为纯广告页则删除；若为目录页则保留并清洗。
    *   **尾部处理**: **强制删除倒数后 3 页**（通常为结束语、推荐下载、版权页）。
4.  **品牌注入**:
    *   在末尾追加 **1 页** 标准化的品牌广告/结束页（从模板库加载）。

### 车间 C：AI 内容理解 (AI Enrichment)
1.  **全文本提取**: 提取清洗后的 PPT 所有可见文本。
2.  **LLM 分析**:
    *   **Summary**: 生成 200 字摘要。
    *   **Keywords**: 提取 5-10 个核心关键词（补全 Tags）。
    *   **Scenario**: 识别适用场景（如“医疗汇报”、“年终总结”）。
    *   **Structure**: 提取大纲结构。
3.  **向量化准备**: 将上述文本组合，为 Embedding 做好准备。

### 车间 D：成品输出 (Output)
*   **文件**: 存入 `output/{channel_id}/`。
*   **数据**: 写入 `assets.db` (processed_assets 表)。

## 4. 目录结构规划

```text
piliang/
├── docs/                # 文档
├── src/
│   ├── cleaner.py       # 清洗逻辑 (python-pptx)
│   ├── ai_processor.py  # AI 摘要与提取
│   ├── pipeline.py      # 主调度程序
│   ├── db.py            # 数据库操作
│   └── templates/       # 品牌资产
│       └── brand_end_slide.pptx  # 统一结束页模板
├── input/               # (Symlink) -> pachong/downloads
├── output/              # 最终产物
├── requirements.txt
└── README.md
```

## 5. 关键难点对策
*   **母版水印**: 必须遍历 `prs.slide_masters`。
*   **加密文件**: 捕获异常，记录日志，人工后续处理。
*   **图片Logo**: 无法直接替换，策略是删除特定小尺寸图片或覆盖。

## 6. 下一步行动
1.  初始化 Python 项目环境。
2.  编写 `cleaner.py` 原型，测试单个 PPT 的清洗效果。
3.  制作并放置 `brand_end_slide.pptx`。
