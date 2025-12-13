# PPT 批量处理与智能化工厂建设方案 (V2.0)

> **修订记录**:
> - V2.0: 基于对下载样本的实地解剖 (Autopsy) 进行修正。明确了去水印策略、品牌注入细节及 AI 交互模式。
> - V1.0: 初始草案。

## 1. 项目背景与目标
本项目旨在建立一条自动化的数据生产流水线 (Pipeline)，将爬虫采集到的原始 PPT 模板资源转化为**标准化、无品牌痕迹、高价值**的成品资源。
重点在于**品牌重塑 (Rebranding)**，将来源痕迹（如“第一PPT”）彻底替换为自有品牌 **PPTHub** (`https://www.ppthub.shop/`)，并为 AI 检索做好数据准备。

## 2. 技术路线选型 (Tech Stack)

*   **核心语言**: **Python 3.10+**
*   **PPT 操作**: **`python-pptx`** (深度清洗与页面重构)
*   **AI 交互**: **Gemini CLI (Subprocess/File-based)** - *变更*: 放弃 API 调用，改用生成 Prompt 文件 -> 人工/CLI 执行 -> 读回结果的离线模式，以适应当前环境。
*   **基础库**: `zipfile`, `sqlite3`, `pandas`

## 3. 核心处理流程 (Pipeline Design)

### 车间 A：预处理 (ETL)
1.  **输入**: 链接至 `pachong/downloads`。
2.  **解压**: 提取主 `.pptx` 文件，丢弃说明文档和 URL 快捷方式。
3.  **标准化**: 重命名为 `{aid}-{title}.pptx`。
4.  **封面**: 迁移并重命名封面图片至 `output/{channel}/images/`。

### 车间 B：深度清洗 (Deep Cleaning) - *基于调研修正*

#### 1. 全局文本清洗
*   **遍历范围**: Slide Shapes, Table Cells, Notes, Slide Masters (虽然调研显示母版较干净，但必须防御性扫描)。
*   **替换规则**:
    *   `"第一PPT"` / `"1ppt"` -> **删除** 或替换为 `"PPTHub"`.
    *   `"www.1ppt.com"` -> **替换** 为 `"www.ppthub.shop"`.
    *   `"第一PPT模板网"` -> **删除**.
*   **元数据 (Core Properties) 重置**:
    *   `Title`: `{title} - PPTHub`
    *   `Author`: `PPTHub`
    *   `Company`: `PPTHub Inc.`
    *   `Comments`: `Download more at https://www.ppthub.shop/`

#### 2. 页面手术 (Page Surgery)
*   **首页 (P1)**:
    *   扫描副标题占位符，若为空则注入 `Presented by PPTHub`。
*   **尾部处理 (Tail Cutting) - *关键修正***:
    *   **策略**: **从后往前**遍历页面。
    *   **判定**: 只要页面包含 `1ppt`、`第一PPT`、`下载说明` 等关键词，**立即删除**。
    *   **保底**: 默认强制删除最后 3 页 (实测 Slide 21-23 均为广告/版权页)。
*   **品牌注入**:
    *   在清理后的末尾，插入 **1 页** 标准化的 `brand_end_slide.pptx`。
    *   **模板内容**: "THANKS", "感谢您的观看", "更多精品模板: https://www.ppthub.shop/"。

### 车间 C：AI 内容理解 (AI Enrichment) - *离线模式*
1.  **提取**: 脚本将清洗后的 PPT 全文提取为 `{aid}.txt`。
2.  **Prompt 生成**: 脚本自动生成 `{aid}_prompt.md`，包含：
    *   Tags (来自 DB)
    *   Title
    *   Full Text
    *   指令: "请总结适用场景、提取 5 个关键词、生成 200 字摘要"。
3.  **执行**: 用户（或自动化脚本）在 Gemini CLI 中批量运行这些 Prompt。
4.  **回填**: 脚本解析 AI 的输出，更新数据库。

### 车间 D：成品输出
*   **文件结构**:
    ```text
    output/
    └── ppt_moban/
        ├── 139719-蓝紫宇航员....pptx  (已清洗)
        └── images/
            └── 139719-cover.jpg
    ```
*   **数据库**: 更新 `processed_assets` 表，标记 `is_cleaned=1`。

## 4. 目录结构规划

```text
piliang/
├── docs/
├── src/
│   ├── scripts/
│   │   ├── cleaner.py       # 核心清洗脚本
│   │   ├── create_template.py # 品牌模板生成器
│   │   └── investigate_ppt.py # 调研工具
│   ├── templates/
│   │   └── brand_end_slide.pptx  # 你的品牌结束页
│   └── pipeline.py      # 流水线入口
├── input_link/          # (软链接) -> ../pachong/downloads
├── output/              # 清洗后的成品
└── requirements.txt
```

## 5. 关键决策点确认
*   [x] **尾部处理**: 确认倒数 3 页包含版权、推荐、结束页，策略为**全部删除并替换**。
*   [x] **品牌注入**: 已生成 `brand_end_slide.pptx`，包含 PPTHub 链接。
*   [x] **AI 模式**: 采用“提取文本 -> CLI 处理”的解耦模式，不依赖 API Key。
