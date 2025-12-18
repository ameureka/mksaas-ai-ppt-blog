#!/usr/bin/env python3
"""
AI Caller - 统一 AI 调用入口
支持 DeepSeek (SiliconFlow) 和 Gemini CLI 双方案

用法:
    python ai_caller.py <prompt_file> <output_file>

环境变量:
    AI_PROVIDER: deepseek | gemini (默认: deepseek)
    SILICONFLOW_API_KEY: SiliconFlow API Key (deepseek 方案必需)

示例:
    AI_PROVIDER=deepseek python ai_caller.py prompt.md output.json
    AI_PROVIDER=gemini python ai_caller.py prompt.md output.json
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


# ============================================================
# JSON 提取工具 (两种方案共用)
# ============================================================

def extract_json(text: str) -> dict:
    """
    从 AI 响应中提取 JSON
    支持: 纯 JSON / ```json 代码块 / {...} 匹配
    """
    text = text.strip()
    
    # 1. 直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # 2. 提取 ```json ... ``` 或 ``` ... ``` 块
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 3. 提取 {...} 块 (贪婪匹配最外层)
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"无法从响应中提取 JSON: {text[:200]}...")


# ============================================================
# 方案 1: DeepSeek (通过 SiliconFlow API)
# ============================================================

def call_deepseek(prompt: str) -> dict:
    """
    调用 DeepSeek API (通过 SiliconFlow)
    
    API 端点: https://api.siliconflow.cn/v1/chat/completions
    模型: deepseek-ai/DeepSeek-V3
    """
    api_key = os.environ.get('SILICONFLOW_API_KEY')
    if not api_key:
        raise ValueError("SILICONFLOW_API_KEY 环境变量未设置")
    
    # 构建请求
    data = json.dumps({
        "model": "deepseek-ai/DeepSeek-V3",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode('utf-8')
    
    req = urllib.request.Request(
        "https://api.siliconflow.cn/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        raise RuntimeError(f"DeepSeek API 错误 ({e.code}): {error_body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"网络错误: {e.reason}") from e
    
    # 提取响应内容
    content = result['choices'][0]['message']['content']
    return extract_json(content)


# ============================================================
# 方案 2: Gemini CLI
# ============================================================

def extract_gemini_response(output: str) -> str:
    """
    从 Gemini CLI 输出中提取实际响应
    过滤启动日志: Loaded, Loading, [STARTUP]
    """
    lines = output.strip().splitlines()
    
    # 收集非日志行
    response_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith(('[STARTUP]', 'Loading', 'Loaded')):
            response_lines.append(line)
    
    return '\n'.join(response_lines)


def call_gemini(prompt: str) -> dict:
    """
    调用 Gemini CLI
    
    命令: gemini "prompt"
    超时: 180 秒 (Gemini CLI 启动较慢)
    """
    try:
        result = subprocess.run(
            ['gemini', prompt],
            capture_output=True,
            text=True,
            timeout=180,
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError("Gemini CLI 超时 (180s)") from e
    except FileNotFoundError as e:
        raise RuntimeError("Gemini CLI 未安装，请运行: npm install -g @anthropic-ai/gemini") from e
    
    if result.returncode != 0:
        raise RuntimeError(f"Gemini CLI 失败: {result.stderr}")
    
    # 提取响应并解析 JSON
    response = extract_gemini_response(result.stdout)
    return extract_json(response)


# ============================================================
# 主入口
# ============================================================

PROVIDERS = {
    'deepseek': call_deepseek,
    'gemini': call_gemini,
}


def main():
    if len(sys.argv) != 3:
        print("用法: python ai_caller.py <prompt_file> <output_file>", file=sys.stderr)
        print("环境变量: AI_PROVIDER=deepseek|gemini", file=sys.stderr)
        sys.exit(1)
    
    prompt_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    
    # 读取 provider
    provider = os.environ.get('AI_PROVIDER', 'deepseek').lower()
    if provider not in PROVIDERS:
        print(f"错误: 不支持的 AI_PROVIDER={provider}", file=sys.stderr)
        print(f"支持的选项: {', '.join(PROVIDERS.keys())}", file=sys.stderr)
        sys.exit(1)
    
    # 读取 prompt
    if not prompt_path.exists():
        print(f"错误: prompt 文件不存在: {prompt_path}", file=sys.stderr)
        sys.exit(1)
    
    prompt = prompt_path.read_text(encoding='utf-8')
    
    # 调用 AI
    print(f"[ai_caller] 使用 {provider} 处理: {prompt_path.name}", file=sys.stderr)
    
    try:
        result = PROVIDERS[provider](prompt)
    except Exception as e:
        print(f"[ai_caller] 错误: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 写入输出
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    
    print(f"[ai_caller] 成功: {output_path}")


if __name__ == '__main__':
    main()
