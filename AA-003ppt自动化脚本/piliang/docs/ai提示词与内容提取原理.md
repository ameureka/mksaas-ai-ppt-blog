# AI 提示词与内容提取原理

## 概述

Piliang 流水线的 AI 处理部分（Workshop C）采用 **提示词文件化 + CLI 工具调用** 的解耦设计，便于切换不同的 AI 提供商，同时保持流水线的稳定性。

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        Workshop C (AI 理解)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ TextExtractor │───▶│ PromptBuilder │───▶│  AIAdapter   │       │
│  │  提取PPT文本  │    │  生成提示词   │    │  调用CLI工具  │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                                                  ▼               │
│                                          ┌──────────────┐       │
│                                          │   AIParser   │       │
│                                          │  解析AI输出   │       │
│                                          └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  外部 CLI 工具    │
                    │ (gemini/openai)  │
                    └──────────────────┘
```

## 核心组件

### 1. TextExtractor（文本提取器）

**位置**: `src/factory/ai/text_extractor.py`

**功能**: 从 PPTX 文件中提取所有文本内容

```python
class TextExtractor:
    def extract(self, pptx_path: Path) -> ExtractedText:
        """
        提取 PPT 中的所有文本
        - 遍历所有幻灯片
        - 提取文本框、表格、图表中的文字
        - 返回合并后的全文
        """
        
    def filter_placeholders(self, text: str) -> str:
        """
        过滤无意义的占位符文本
        - 移除 "Click to add title"
        - 移除 "Lorem ipsum"
        - 移除 "Enter text here"
        """
```

**输出示例**:
```python
ExtractedText(
    full_text="公司简介\n我们是一家专注于...\n产品介绍\n...",
    char_count=1500,
    slide_count=25,
)
```

### 2. PromptBuilder（提示词构建器）

**位置**: `src/factory/ai/prompt_builder.py`

**功能**: 将提取的文本与模板结合，生成完整的提示词文件

```python
class PromptBuilder:
    def build(self, *, aid: str, title: str, meta: dict, pptx_path: Path) -> Path:
        """
        生成提示词文件
        1. 调用 TextExtractor 提取文本
        2. 加载提示词模板 (configs/ai_prompt_template.md)
        3. 填充变量 {title}, {original_tags}, {extracted_text}
        4. 保存为 prompt.md 文件
        """
```

**提示词模板** (`configs/ai_prompt_template.md`):
```markdown
# PPT 模板元数据生成任务

## 输入信息
- **标题**: {title}
- **频道**: {channel_name}
- **原始标签**: {original_tags}

## PPT 全文内容
{extracted_text}

## 任务要求
请根据以上信息，输出以下 JSON 格式的元数据...

## 输出格式
```json
{
  "ai_summary": "200字以内的中文介绍",
  "ai_keywords": ["关键词1", "关键词2"],
  "ppthub_category": "business",
  "language": "中文"
}
```
```

**生成的提示词文件示例** (`prompts/139646/prompt.md`):
```markdown
<!-- aid: 139646 | title: 灰色简约商务PPT | channel: 欧美PPT模板 -->

# PPT 模板元数据生成任务

## 输入信息
- **标题**: 灰色简约商务PPT
- **频道**: 欧美PPT模板
- **原始标签**: ["商务", "简约", "欧美风"]

## PPT 全文内容
公司简介
我们是一家专注于企业服务的科技公司...
产品介绍
我们的核心产品包括...

## 任务要求
...
```

### 3. AIAdapter（AI 适配器）

**位置**: `src/factory/ai/ai_adapter.py`

**功能**: 调用外部 CLI 工具执行 AI 推理

```python
@dataclass(frozen=True)
class AIAdapterConfig:
    command_template: list[str]  # ["gemini", "{prompt}", "{output}"]
    timeout_seconds: int = 120
    max_retries: int = 3
    retry_delay_seconds: float = 2.0
    retry_backoff_multiplier: float = 2.0

class AIAdapter:
    def run(self, prompt_path: Path, output_path: Path) -> dict:
        """
        调用 CLI 工具
        1. 替换命令模板中的 {prompt} 和 {output}
        2. 执行 subprocess.run()
        3. 读取输出文件并返回 JSON
        """
        args = ["gemini", "/path/to/prompt.md", "/path/to/output.json"]
        subprocess.run(args, timeout=120)
        return json.loads(output_path.read_text())
```

**CLI 调用示例**:
```bash
# 实际执行的命令
gemini /tmp/prompts/139646/prompt.md /tmp/ai/139646.json
```

**重试机制**:
- 超时自动重试（指数退避）
- 可配置重试次数和延迟
- 支持自定义可重试的退出码

### 4. AIParser（AI 输出解析器）

**位置**: `src/factory/ai/ai_parser.py`

**功能**: 解析和校验 AI 输出的 JSON

```python
class AIParser:
    def parse(self, payload: dict) -> AiMeta:
        """
        解析 AI 输出
        1. 校验必需字段存在
        2. 校验字段长度限制 (ai_summary ≤ 500字)
        3. 校验分类/语言合法性
        4. 过滤敏感词
        5. 截断过长字段
        """
```

**校验规则**:
| 字段 | 限制 |
|------|------|
| `ai_summary` | ≤ 500 字符，超长截断 |
| `ai_scenario` | ≤ 200 字符，超长截断 |
| `ppthub_category` | 必须为 12 个合法 slug 之一 |
| `language` | 必须为 `中文/English/其他` 之一 |

**非法值处理**:
- 无效分类 → 回退到 `general`
- 无效语言 → 回退到 `其他`
- 包含敏感词 → 替换或移除

## 完整处理流程

```
输入: EtlOutput (包含 pptx_path, meta)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 规则优先匹配                                         │
│ RuleEngine.match(title, tags)                               │
│ - 标题含"报告" → category = "report"                         │
│ - 标题含"总结" → category = "summary"                        │
└─────────────────────────────────────────────────────────────┘
      │
      ▼ (规则未命中)
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 提取 PPT 文本                                        │
│ TextExtractor.extract(pptx_path)                            │
│ → 返回全文内容                                               │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 生成提示词文件                                       │
│ PromptBuilder.build(aid, title, meta, pptx_path)            │
│ → 保存 prompts/{aid}/prompt.md                              │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 调用 AI CLI                                          │
│ AIAdapter.run(prompt_path, output_path)                     │
│ → 执行: gemini prompt.md output.json                        │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: 解析 AI 输出                                         │
│ AIParser.parse(json_payload)                                │
│ → 校验字段、截断、回退                                        │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: 字段合并                                             │
│ FieldMerger.merge(title, tags, ai_meta)                     │
│ → 规则优先，AI 补充                                          │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
输出: ppthub_category, language, tags_final, description_final
```

## CLI 工具接口规范

### 输入输出约定

Piliang 期望的 CLI 工具接口：

```bash
your-ai-cli <prompt_file> <output_file>
```

| 参数 | 说明 |
|------|------|
| `prompt_file` | 输入：提示词文件路径（Markdown 格式） |
| `output_file` | 输出：JSON 结果文件路径 |

### 输出 JSON 格式

```json
{
  "ai_summary": "200字以内的中文介绍，描述模板的风格、配色、设计元素和适用场景",
  "ai_keywords": ["关键词1", "关键词2", "关键词3"],
  "ai_scenario": "适合的具体使用场景",
  "ai_color_scheme": "主要配色方案",
  "ai_structure_features": "模板内部结构特点",
  "ai_template_features": "模板独特编辑特点",
  "ppthub_category": "business",
  "language": "中文"
}
```

### 合法的分类值 (ppthub_category)

| Slug | 说明 |
|------|------|
| `business` | 商务/企业/公司介绍 |
| `education` | 教育/培训/课件/答辩 |
| `technology` | 科技/互联网/IT/人工智能 |
| `design` | 设计/创意/艺术/作品集 |
| `marketing` | 营销/市场/品牌/推广 |
| `hr` | 人力资源/招聘/团队建设 |
| `medical` | 医疗/健康/医学 |
| `finance` | 金融/财务/投资/预算 |
| `general` | 通用/简约/节日 |
| `summary` | 年终总结/工作总结/复盘 |
| `report` | 述职报告/工作汇报/竞聘 |
| `plan` | 工作计划/项目计划/规划 |

### 合法的语言值 (language)

| 值 | 说明 |
|------|------|
| `中文` | 模板主要内容为中文 |
| `English` | 模板主要内容为英文 |
| `其他` | 其他语言或混合语言 |

## 配置说明

### WorkshopCConfig

```python
@dataclass(frozen=True)
class WorkshopCConfig:
    project_root: Path           # 项目根目录
    prompt_output_dir: Path      # 提示词输出目录
    ai_output_dir: Path          # AI 输出目录
    ai_command: list[str]        # CLI 命令模板，如 ["gemini", "{prompt}", "{output}"]
```

### 环境变量（可选）

```bash
# AI 超时配置
AI_TIMEOUT_SECONDS=120
AI_MAX_RETRIES=3
```

## 扩展：自定义 CLI 工具

如需接入新的 AI 提供商，只需实现一个 CLI 工具：

```python
#!/usr/bin/env python
# my_ai_cli.py
import sys
import json
from openai import OpenAI

def main():
    prompt_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # 读取提示词
    prompt = open(prompt_file).read()
    
    # 调用 AI
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
    )
    
    # 解析并保存结果
    result = json.loads(response.choices[0].message.content)
    with open(output_file, 'w') as f:
        json.dump(result, f, ensure_ascii=False)

if __name__ == "__main__":
    main()
```

然后配置：
```python
ai_command=["python", "my_ai_cli.py", "{prompt}", "{output}"]
```

## 总结

| 设计决策 | 原因 |
|----------|------|
| **提示词文件化** | 便于调试、复现、人工审核 |
| **CLI 工具解耦** | 可切换 AI 提供商，不改流水线代码 |
| **规则优先** | 减少 AI 调用成本，提高确定性 |
| **输出校验** | 防止 AI 幻觉，保证数据质量 |
| **重试机制** | 应对 AI 服务不稳定 |
