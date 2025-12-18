# Workshop C 流程分析改进

## 一、当前配置状态

| 配置项 | 状态 | 值 |
|--------|------|-----|
| AI_PROVIDER | ✅ | `deepseek` |
| SILICONFLOW_API_KEY | ✅ | 已配置 |
| AI_COMMAND_TEMPLATE | ✅ | `python scripts/ai_caller.py {prompt} {output}` |
| AI_TIMEOUT_SECONDS | ✅ | 180s |
| ai_caller.py | ✅ | 支持 DeepSeek/Gemini |
| ai_prompt_template.md | ✅ | 完整模板 |

## 二、处理流程

```
CleanOutput → RuleEngine → TextExtractor → PromptBuilder → AIAdapter → AIParser → FieldMerger → AiMeta
```

### 详细步骤

1. **RuleEngine** - 规则优先匹配分类（标题含"报告"→report）
2. **TextExtractor** - 提取 PPTX 全文内容
3. **PromptBuilder** - 生成提示词文件（填充模板变量）
4. **AIAdapter** - 调用 `ai_caller.py`（DeepSeek API）
5. **AIParser** - 解析校验 AI 输出 JSON
6. **FieldMerger** - 合并规则结果和 AI 结果

## 三、AI 输出字段

| 字段 | 说明 | 限制 |
|------|------|------|
| ai_summary | 卡片摘要 | ≤100字 |
| ai_content_summary | SEO描述 | 300-800字 |
| ai_keywords | 关键词 | 5-10个 |
| ppthub_category | 分类 | 12个有效值 |
| language | 语言 | 中文/English/其他 |

## 四、验证步骤

### 步骤1：测试 AI 调用
```bash
cd piliang && source .venv/bin/activate && source .env
echo '请输出: {"test": "ok"}' > /tmp/test.md
python scripts/ai_caller.py /tmp/test.md /tmp/out.json
cat /tmp/out.json
```

### 步骤2：运行 Workshop C
```bash
python scripts/run_smoke_batch.py \
  --manifest fixtures/small_batch_manifest.json \
  --db data/assets.db \
  --from-stage preflight --to-stage C --enable-ai
```

## 五、有效分类值

business, education, technology, design, marketing, hr, medical, finance, general, summary, report, plan
