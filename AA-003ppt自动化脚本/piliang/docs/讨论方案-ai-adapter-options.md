# AI Adapter 方案对比

> 文档创建时间: 2025-12-15
> 目的: 分析 Workshop C 的 AI 调用方案，支持无 API Key 场景

## 背景

Workshop C (AI Enrichment) 需要调用大模型生成 PPT 元数据。当前架构通过 `AIAdapter` 调用外部脚本：

```
AIAdapter → subprocess → ai_caller.py → OpenAI API
```

问题：用户可能没有 OpenAI API Key，但有已登录的本地 CLI 工具。

## 系统可用的 AI CLI 工具

| 工具 | 路径 | 状态 |
|------|------|------|
| `gemini` | `/usr/local/bin/gemini` | ✅ 已安装 |
| `claude` | `/usr/local/bin/claude` | ✅ 已安装 |
| `kiro-cli` | `~/.local/bin/kiro-cli` | ✅ 已登录 |
| `gcloud` | Vertex AI | ✅ 已登录 yalinwang2@gmail.com |

---

## 方案 A: OpenAI API (当前实现)

### 架构

```
PromptBuilder → prompt.md
                    ↓
AIAdapter → subprocess.run(["python", "ai_caller.py", "{prompt}", "{output}"])
                    ↓
ai_caller.py → OpenAI API (gpt-4o-mini)
                    ↓
output.json ← AIAdapter 读取返回
```

### 配置

```bash
# .env
OPENAI_API_KEY=sk-xxx
AI_COMMAND_TEMPLATE=python scripts/ai_caller.py {prompt} {output}
```

### 代码 (ai_caller.py)

```python
def call_openai(prompt: str) -> str:
    api_key = os.environ.get('OPENAI_API_KEY')
    data = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }).encode('utf-8')
    
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode('utf-8'))
    
    return result['choices'][0]['message']['content']
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 稳定可控 | 需要 API Key |
| 支持 JSON mode | 按 token 计费 |
| 可配置模型 | 需要网络 |

---

## 方案 B: Claude CLI (推荐)

### 架构

```
PromptBuilder → prompt.md
                    ↓
AIAdapter → subprocess.run(["python", "ai_caller_claude.py", "{prompt}", "{output}"])
                    ↓
ai_caller_claude.py → claude -p --output-format json
                    ↓
output.json ← AIAdapter 读取返回
```

### Claude CLI 特性

```bash
# 非交互模式
claude -p "your prompt"

# JSON 输出
claude -p --output-format json "your prompt"

# 带 Schema 验证
claude -p --output-format json --json-schema '{"type":"object",...}' "your prompt"
```

### 配置

```bash
# .env
AI_COMMAND_TEMPLATE=python scripts/ai_caller_claude.py {prompt} {output}
AI_PROVIDER=claude
```

### 代码 (ai_caller_claude.py)

```python
#!/usr/bin/env python3
"""使用 Claude CLI 处理 PPT 元数据生成"""
import json
import subprocess
import sys
from pathlib import Path

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "ai_summary": {"type": "string"},
        "ai_keywords": {"type": "array", "items": {"type": "string"}},
        "ai_scenario": {"type": "string"},
        "ai_color_scheme": {"type": "string"},
        "ai_structure_features": {"type": "string"},
        "ai_template_features": {"type": "string"},
        "ppthub_category": {"type": "string"},
        "language": {"type": "string"}
    },
    "required": ["ai_summary", "ai_keywords", "ppthub_category", "language"]
}

def call_claude(prompt: str) -> dict:
    result = subprocess.run(
        [
            'claude', '-p',
            '--output-format', 'json',
            '--json-schema', json.dumps(JSON_SCHEMA),
            prompt
        ],
        capture_output=True,
        text=True,
        timeout=120
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI failed: {result.stderr}")
    
    return json.loads(result.stdout)

def main():
    prompt_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    
    prompt = prompt_path.read_text(encoding='utf-8')
    result = call_claude(prompt)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"OK: {output_path}")

if __name__ == '__main__':
    main()
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 无需 API Key | 需要 Claude 订阅 |
| 原生 JSON 输出 | CLI 版本可能变化 |
| Schema 验证 | 输出格式依赖 CLI |
| 本地已登录 | - |

---

## 方案 C: Gemini CLI

### 架构

```
PromptBuilder → prompt.md
                    ↓
AIAdapter → subprocess.run(["python", "ai_caller_gemini.py", "{prompt}", "{output}"])
                    ↓
ai_caller_gemini.py → gemini "prompt"
                    ↓
extract_response() → extract_json() → output.json
```

### Gemini CLI 特性

```bash
# 基本用法 (positional prompt)
gemini "your prompt"

# 从文件读取
gemini "$(cat prompt.md)"

# JSON 输出格式 (支持)
gemini --output-format json "your prompt"
```

### 实际输出格式 (2025-12-15 测试)

```
Loaded cached credentials.
Loading extension: ComputerUse
Loading extension: code-review
Loading extension: gemini-plan-commands
Loading extension: nanobanana
[STARTUP] StartupProfiler.flush() called with 9 phases
[STARTUP] Recording metric for phase: cli_startup duration: 1249.186208
[STARTUP] Recording metric for phase: load_settings duration: 1.241083
[STARTUP] Recording metric for phase: migrate_settings duration: 0.662791
[STARTUP] Recording metric for phase: parse_arguments duration: 18.163290
[STARTUP] Recording metric for phase: load_cli_config duration: 60.900292
[STARTUP] Recording metric for phase: initialize_app duration: 1162.687416
[STARTUP] Recording metric for phase: authenticate duration: 1156.130625
[STARTUP] Recording metric for phase: discover_tools duration: 3.708375
[STARTUP] Recording metric for phase: initialize_mcp_clients duration: 1335.311458
{"status":"ok","value":123}   ← AI 响应在最后一行
```

### 输出规律

| 特征 | 说明 |
|------|------|
| 启动日志 | 前 15+ 行是 CLI 启动信息 |
| AI 响应位置 | **最后一行** |
| 响应格式 | 要求输出 JSON 时，通常是纯 JSON |
| 启动时间 | ~15 秒（已缓存凭证） |
| 需过滤前缀 | `Loaded`、`Loading`、`[STARTUP]` |

### 配置

```bash
# .env
AI_COMMAND_TEMPLATE=python scripts/ai_caller_gemini.py {prompt} {output}
AI_PROVIDER=gemini
```

### 代码 (ai_caller_gemini.py)

```python
#!/usr/bin/env python3
"""使用 Gemini CLI 处理 PPT 元数据生成"""
import json
import re
import subprocess
import sys
from pathlib import Path


def extract_response(output: str) -> str:
    """提取 Gemini CLI 的实际响应（过滤启动日志）"""
    lines = output.strip().splitlines()
    # 从后往前找第一个非启动日志行
    for line in reversed(lines):
        line = line.strip()
        if line and not line.startswith(('[STARTUP]', 'Loading', 'Loaded')):
            return line
    return lines[-1] if lines else ''


def extract_json(text: str) -> dict:
    """从 AI 响应中提取 JSON"""
    # 尝试直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # 尝试提取 ```json ... ``` 块
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 尝试找到 { ... } 块
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"Cannot extract JSON from response: {text[:200]}")


def call_gemini(prompt: str) -> dict:
    result = subprocess.run(
        ['gemini', prompt],
        capture_output=True,
        text=True,
        timeout=180  # Gemini CLI 启动较慢，需要更长超时
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Gemini CLI failed: {result.stderr}")
    
    # 先提取响应行，再解析 JSON
    response = extract_response(result.stdout)
    return extract_json(response)


def main():
    prompt_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    
    prompt = prompt_path.read_text(encoding='utf-8')
    result = call_gemini(prompt)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"OK: {output_path}")


if __name__ == '__main__':
    main()
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 免费额度高 | 启动较慢 (~15s) |
| 无需 API Key | 输出需过滤启动日志 |
| Google 账号登录 | - |
| 本地已登录 | - |
| 支持 --output-format json | - |

### 后处理复杂度: ⭐ 简单

只需两步：
1. `extract_response()` - 取最后一个非日志行
2. `extract_json()` - 解析 JSON（兼容 markdown 代码块）

---

## 方案对比总结

| 维度 | OpenAI API | Claude CLI | Gemini CLI |
|------|------------|------------|------------|
| 需要 API Key | ✅ 是 | ❌ 否 | ❌ 否 |
| JSON 输出 | ✅ 原生 | ✅ 原生 | ✅ 支持 (需过滤日志) |
| Schema 验证 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| 成本 | 💰 按量付费 | 💰 订阅制 | 🆓 免费额度高 |
| 启动速度 | ⚡ 快 | ⚡ 快 | 🐢 ~15秒 |
| 后处理复杂度 | 无 | 无 | ⭐ 简单 |
| 稳定性 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| 推荐场景 | 生产环境 | 开发/测试 | 开发/测试/免费方案 |

---

## 实施建议

### 短期 (开发测试)

使用 **Claude CLI** 方案：
1. 创建 `scripts/ai_caller_claude.py`
2. 配置 `AI_COMMAND_TEMPLATE=python scripts/ai_caller_claude.py {prompt} {output}`
3. 测试批处理流程

### 长期 (生产环境)

使用 **OpenAI API** 方案：
1. 申请 API Key
2. 配置成本预算和限流
3. 监控 token 使用量

### 配置切换

支持通过环境变量切换 AI 提供商：

```bash
# .env
AI_PROVIDER=claude  # openai | claude | gemini
AI_COMMAND_TEMPLATE=python scripts/ai_caller_{AI_PROVIDER}.py {prompt} {output}
```

或创建统一入口脚本 `ai_caller.py`，根据 `AI_PROVIDER` 环境变量选择后端。
