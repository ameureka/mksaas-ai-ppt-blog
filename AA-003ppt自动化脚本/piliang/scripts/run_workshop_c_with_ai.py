#!/usr/bin/env python3
"""
Workshop C 完整 AI 调用测试脚本
使用 DeepSeek (SiliconFlow API) 进行真实的 AI 增强处理

输出结构:
data/
├── prompts/
│   └── {aid}/
│       └── prompt.md          # 生成的提示词文件
├── ai_output/
│   └── {aid}/
│       └── output.json        # AI 原始响应
└── logs/
    └── ai_call_log.db         # AI 调用日志
"""

from __future__ import annotations

import json
import os
import shutil
import sqlite3
import sys
import time
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / 'src'))

# 加载 .env 文件
from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / '.env')

from factory.config import load_factory_config, FactoryConfig
from factory.types import StandardInputPackage
from factory.workshops.workshopA import WorkshopA, WorkshopAConfig
from factory.workshops.workshopB import WorkshopB, WorkshopBConfig
from factory.ai import (
    AIEnrichmentService,
    EnrichmentServiceConfig,
    EtlOutput,
    create_etl_output,
    TextExtractor,
    LanguageDetector,
    TagsNormalizer,
    DescriptionBuilder,
    PromptBuilder,
    PromptBuilderConfig,
    AIAdapter,
    AIAdapterConfig,
    AiParser,
)


@dataclass
class WorkshopCResult:
    """Workshop C 处理结果"""
    aid: str
    success: bool
    prompt_path: Path | None = None
    output_path: Path | None = None
    ai_response: dict | None = None
    ppthub_category: str | None = None
    language: str | None = None
    tags_final: list[str] | None = None
    description_final: str | None = None
    ai_summary: str | None = None
    ai_keywords: list[str] | None = None
    ai_scenario: str | None = None
    ai_color_scheme: str | None = None
    ai_structure_features: str | None = None
    ai_template_features: str | None = None
    error_message: str | None = None
    duration_ms: int = 0


def setup_directories(base_dir: Path) -> tuple[Path, Path, Path]:
    """设置输出目录结构"""
    prompts_dir = base_dir / 'prompts'
    ai_output_dir = base_dir / 'ai_output'
    logs_dir = base_dir / 'logs'

    prompts_dir.mkdir(parents=True, exist_ok=True)
    ai_output_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)

    return prompts_dir, ai_output_dir, logs_dir


def setup_ai_call_log_db(logs_dir: Path) -> sqlite3.Connection:
    """创建 AI 调用日志数据库"""
    db_path = logs_dir / 'ai_call_log.db'
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS ai_call_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aid TEXT NOT NULL,
            batch_id TEXT,
            call_type TEXT NOT NULL,  -- 'ai_call' | 'cache_hit' | 'rule_match'
            model_name TEXT,
            prompt_path TEXT,
            output_path TEXT,
            status TEXT NOT NULL,  -- 'success' | 'failed' | 'timeout'
            error_message TEXT,
            latency_ms INTEGER,
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_ai_call_log_aid ON ai_call_log(aid);
        CREATE INDEX IF NOT EXISTS idx_ai_call_log_status ON ai_call_log(status);
        CREATE INDEX IF NOT EXISTS idx_ai_call_log_created_at ON ai_call_log(created_at);
    ''')
    conn.commit()

    return conn


def log_ai_call(
    conn: sqlite3.Connection,
    *,
    aid: str,
    batch_id: str,
    call_type: str,
    model_name: str,
    prompt_path: str | None,
    output_path: str | None,
    status: str,
    error_message: str | None,
    latency_ms: int,
) -> None:
    """记录 AI 调用日志"""
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO ai_call_log (
            aid, batch_id, call_type, model_name, prompt_path, output_path,
            status, error_message, latency_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        aid, batch_id, call_type, model_name, prompt_path, output_path,
        status, error_message, latency_ms
    ))
    conn.commit()


def select_test_files(downloads_dir: Path, count: int = 5) -> list[Path]:
    """选择测试文件"""
    zip_files = list(downloads_dir.glob('**/*.zip'))
    selected = zip_files[:count]

    print(f"\n选择的测试文件 ({len(selected)} 个):")
    for i, f in enumerate(selected, 1):
        print(f"  {i}. {f.name}")

    return selected


def prepare_pptx_files(
    zip_files: list[Path],
    work_dir: Path,
) -> list[dict]:
    """准备 PPTX 文件（解压并提取信息）"""
    packages = []
    input_dir = work_dir / 'input_raw'
    input_dir.mkdir(parents=True, exist_ok=True)

    for zip_path in zip_files:
        filename = zip_path.stem
        parts = filename.split('-', 1)
        aid = parts[0] if parts else filename[:6]
        title = parts[1] if len(parts) > 1 else filename
        channel_id = zip_path.parent.name

        asset_dir = input_dir / channel_id / aid
        asset_dir.mkdir(parents=True, exist_ok=True)

        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(asset_dir)

            pptx_files = list(asset_dir.glob('*.pptx'))
            if not pptx_files:
                print(f"  警告: {aid} 没有找到 pptx 文件")
                continue

            main_pptx = asset_dir / 'main.pptx'
            if not main_pptx.exists():
                pptx_files[0].rename(main_pptx)

            packages.append({
                'aid': aid,
                'channel_id': channel_id,
                'title': title,
                'pptx_path': main_pptx,
                'tags': [],
            })

            print(f"  准备完成: {aid} - {title[:40]}...")

        except Exception as e:
            print(f"  错误: {aid} 解压失败 - {e}")

    return packages


def run_workshop_c_with_ai(
    pkg: dict,
    prompts_dir: Path,
    ai_output_dir: Path,
    config: FactoryConfig,
    log_conn: sqlite3.Connection,
    batch_id: str,
) -> WorkshopCResult:
    """
    运行 Workshop C 完整 AI 流程

    流程:
    1. 提取 PPT 文本
    2. 构建 Prompt 文件
    3. 调用 DeepSeek AI
    4. 解析 AI 输出
    5. 标签标准化
    6. 描述构建
    7. 语言检测
    """
    aid = pkg['aid']
    title = pkg['title']
    pptx_path = pkg['pptx_path']
    channel_id = pkg['channel_id']
    original_tags = pkg.get('tags', [])

    start_time = time.time()

    try:
        # ============================================================
        # Step 1: 提取 PPT 文本
        # ============================================================
        print(f"    [1/7] 提取文本...")
        text_extractor = TextExtractor()
        extracted = text_extractor.extract(pptx_path)
        extracted_text = extracted.full_text[:5000]  # 限制长度

        # ============================================================
        # Step 2: 构建 Prompt 文件
        # ============================================================
        print(f"    [2/7] 构建 Prompt...")
        prompt_builder = PromptBuilder(
            PromptBuilderConfig(
                output_dir=prompts_dir,
                template_path=PROJECT_ROOT / 'templates' / 'ai_prompt_template.md',
                use_template=True,
            )
        )

        built_prompt = prompt_builder.build_prompt(
            aid=aid,
            title=title,
            meta={'tags': original_tags, 'channel_id': channel_id},
            pptx_path=pptx_path,
            channel_name=channel_id,
        )

        prompt_path = built_prompt.prompt_path
        print(f"         Prompt 文件: {prompt_path}")

        # ============================================================
        # Step 3: 调用 DeepSeek AI
        # ============================================================
        print(f"    [3/7] 调用 DeepSeek AI...")

        # 设置环境变量
        os.environ['AI_PROVIDER'] = 'deepseek'
        api_key = os.environ.get('SILICONFLOW_API_KEY')
        if not api_key:
            raise ValueError("SILICONFLOW_API_KEY 环境变量未设置")

        # 配置 AI 适配器
        ai_adapter = AIAdapter(
            AIAdapterConfig(
                command_template=['python', str(PROJECT_ROOT / 'scripts' / 'ai_caller.py'), '{prompt}', '{output}'],
                timeout_seconds=180,
                max_retries=2,
            )
        )

        # 输出路径
        output_dir = ai_output_dir / aid
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / 'output.json'

        # 调用 AI
        ai_start = time.time()
        ai_result = ai_adapter.run_with_retry(prompt_path, output_path)
        ai_duration = int((time.time() - ai_start) * 1000)

        if not ai_result.success:
            # 记录失败日志
            log_ai_call(
                log_conn,
                aid=aid,
                batch_id=batch_id,
                call_type='ai_call',
                model_name='deepseek-ai/DeepSeek-V3',
                prompt_path=str(prompt_path),
                output_path=str(output_path),
                status='failed',
                error_message=ai_result.error_message,
                latency_ms=ai_duration,
            )

            raise RuntimeError(f"AI 调用失败: {ai_result.error_code} - {ai_result.error_message}")

        ai_response = ai_result.payload
        print(f"         AI 响应成功 ({ai_duration}ms)")
        print(f"         输出文件: {output_path}")

        # 记录成功日志
        log_ai_call(
            log_conn,
            aid=aid,
            batch_id=batch_id,
            call_type='ai_call',
            model_name='deepseek-ai/DeepSeek-V3',
            prompt_path=str(prompt_path),
            output_path=str(output_path),
            status='success',
            error_message=None,
            latency_ms=ai_duration,
        )

        # ============================================================
        # Step 4: 解析 AI 输出
        # ============================================================
        print(f"    [4/7] 解析 AI 输出...")
        ai_parser = AiParser(
            forbidden_keywords=config.forbidden_keywords,
            valid_categories=[
                'business', 'education', 'technology', 'design', 'marketing',
                'hr', 'medical', 'finance', 'general', 'summary', 'report', 'plan'
            ],
        )

        parse_result = ai_parser.parse_safe(ai_response)
        if not parse_result.success:
            print(f"         警告: AI 输出解析失败 - {parse_result.error_message}")

        ai_meta = parse_result.meta

        # 提取 AI 输出字段
        ai_summary = ai_response.get('ai_summary', '')
        ai_keywords = ai_response.get('ai_keywords', [])
        ai_scenario = ai_response.get('ai_scenario', '')
        ai_color_scheme = ai_response.get('ai_color_scheme', '')
        ai_structure_features = ai_response.get('ai_structure_features', '')
        ai_template_features = ai_response.get('ai_template_features', '')
        ppthub_category = ai_response.get('ppthub_category', 'general')
        ai_language = ai_response.get('language', '中文')

        # ============================================================
        # Step 5: 标签标准化
        # ============================================================
        print(f"    [5/7] 标签标准化...")
        tags_normalizer = TagsNormalizer(
            forbidden_keywords=config.forbidden_keywords,
        )
        normalized_tags = tags_normalizer.normalize(
            original_tags=original_tags,
            ai_keywords=ai_keywords,
            title=title,
        )

        # ============================================================
        # Step 6: 描述构建
        # ============================================================
        print(f"    [6/7] 构建描述...")
        desc_builder = DescriptionBuilder(
            forbidden_keywords=config.forbidden_keywords,
        )
        description_result = desc_builder.build(
            title=title,
            ai_summary=ai_summary,
            ai_scenario=ai_scenario,
            ai_structure_features=ai_structure_features,
        )

        # ============================================================
        # Step 7: 语言检测（合并 AI 输出）
        # ============================================================
        print(f"    [7/7] 语言检测...")
        lang_detector = LanguageDetector()
        rule_lang = lang_detector.detect(extracted_text)
        final_lang = lang_detector.merge_with_ai(rule_lang, ai_language)

        duration_ms = int((time.time() - start_time) * 1000)

        return WorkshopCResult(
            aid=aid,
            success=True,
            prompt_path=prompt_path,
            output_path=output_path,
            ai_response=ai_response,
            ppthub_category=ppthub_category,
            language=final_lang.display,
            tags_final=normalized_tags.tags,
            description_final=description_result.description,
            ai_summary=ai_summary,
            ai_keywords=ai_keywords,
            ai_scenario=ai_scenario,
            ai_color_scheme=ai_color_scheme,
            ai_structure_features=ai_structure_features,
            ai_template_features=ai_template_features,
            duration_ms=duration_ms,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        duration_ms = int((time.time() - start_time) * 1000)
        return WorkshopCResult(
            aid=aid,
            success=False,
            error_message=str(e),
            duration_ms=duration_ms,
        )


def print_result_details(result: WorkshopCResult) -> None:
    """打印详细结果"""
    print(f"\n{'='*60}")
    print(f"Asset: {result.aid}")
    print(f"{'='*60}")

    if result.success:
        print(f"状态: ✓ 成功 ({result.duration_ms}ms)")
        print(f"\n--- 文件输出 ---")
        print(f"Prompt: {result.prompt_path}")
        print(f"AI Output: {result.output_path}")

        print(f"\n--- AI 生成内容 ---")
        print(f"分类: {result.ppthub_category}")
        print(f"语言: {result.language}")
        print(f"配色: {result.ai_color_scheme}")
        print(f"场景: {result.ai_scenario}")

        print(f"\n摘要:")
        print(f"  {result.ai_summary[:200]}..." if result.ai_summary and len(result.ai_summary) > 200 else f"  {result.ai_summary}")

        print(f"\n关键词: {result.ai_keywords}")
        print(f"最终标签: {result.tags_final}")

        print(f"\n结构特点:")
        print(f"  {result.ai_structure_features}")

        print(f"\n模板特点:")
        print(f"  {result.ai_template_features}")

        print(f"\n最终描述:")
        print(f"  {result.description_final[:300]}..." if result.description_final and len(result.description_final) > 300 else f"  {result.description_final}")
    else:
        print(f"状态: ✗ 失败 ({result.duration_ms}ms)")
        print(f"错误: {result.error_message}")


def print_summary(results: list[WorkshopCResult], batch_id: str) -> None:
    """打印汇总报告"""
    print(f"\n{'='*60}")
    print(f"Workshop C AI 处理汇总报告")
    print(f"{'='*60}")
    print(f"批次 ID: {batch_id}")
    print(f"处理时间: {datetime.now().isoformat()}")

    total = len(results)
    success = sum(1 for r in results if r.success)
    failed = total - success
    total_duration = sum(r.duration_ms for r in results)

    print(f"\n统计:")
    print(f"  总数: {total}")
    print(f"  成功: {success} ({success/total*100:.1f}%)")
    print(f"  失败: {failed} ({failed/total*100:.1f}%)")
    print(f"  总耗时: {total_duration}ms ({total_duration/1000:.2f}s)")
    print(f"  平均耗时: {total_duration//total}ms")

    # 分类分布
    categories = {}
    for r in results:
        if r.success and r.ppthub_category:
            categories[r.ppthub_category] = categories.get(r.ppthub_category, 0) + 1

    if categories:
        print(f"\n分类分布:")
        for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
            print(f"  {cat}: {count}")

    # 语言分布
    languages = {}
    for r in results:
        if r.success and r.language:
            languages[r.language] = languages.get(r.language, 0) + 1

    if languages:
        print(f"\n语言分布:")
        for lang, count in sorted(languages.items(), key=lambda x: -x[1]):
            print(f"  {lang}: {count}")

    # 失败列表
    failed_results = [r for r in results if not r.success]
    if failed_results:
        print(f"\n失败列表:")
        for r in failed_results:
            print(f"  {r.aid}: {r.error_message}")


def main() -> int:
    """主函数"""
    print("=" * 60)
    print("Workshop C 完整 AI 调用测试")
    print("使用 DeepSeek (SiliconFlow API)")
    print("=" * 60)

    # 加载配置
    config = load_factory_config(project_root=PROJECT_ROOT)
    print(f"\n项目根目录: {PROJECT_ROOT}")
    print(f"敏感词数量: {len(config.forbidden_keywords)}")
    print(f"AI Provider: {os.environ.get('AI_PROVIDER', 'deepseek')}")

    # 检查 API Key
    api_key = os.environ.get('SILICONFLOW_API_KEY')
    if not api_key:
        print("\n错误: SILICONFLOW_API_KEY 环境变量未设置")
        return 1
    print(f"API Key: {api_key[:10]}...{api_key[-4:]}")

    # 下载目录
    downloads_dir = PROJECT_ROOT / 'data' / 'downloads'
    if not downloads_dir.exists():
        print(f"\n错误: 下载目录不存在: {downloads_dir}")
        return 1

    # 选择测试文件
    zip_files = select_test_files(downloads_dir, count=5)
    if not zip_files:
        print("\n错误: 没有找到测试文件")
        return 1

    # 创建工作目录
    batch_id = f"ai_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    work_dir = PROJECT_ROOT / 'data' / 'workshop_c_ai_test'
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True)

    print(f"\n工作目录: {work_dir}")
    print(f"批次 ID: {batch_id}")

    # 设置输出目录
    prompts_dir, ai_output_dir, logs_dir = setup_directories(work_dir)
    print(f"\n输出目录结构:")
    print(f"  prompts/     - Prompt 文件")
    print(f"  ai_output/   - AI 响应")
    print(f"  logs/        - 调用日志")

    # 创建日志数据库
    log_conn = setup_ai_call_log_db(logs_dir)

    # 准备 PPTX 文件
    print("\n准备 PPTX 文件...")
    packages = prepare_pptx_files(zip_files, work_dir)

    if not packages:
        print("\n错误: 没有成功准备任何文件")
        return 1

    # 运行 Workshop C
    print(f"\n{'='*60}")
    print("开始 Workshop C AI 处理")
    print(f"{'='*60}")

    results: list[WorkshopCResult] = []

    for i, pkg in enumerate(packages, 1):
        print(f"\n[{i}/{len(packages)}] 处理: {pkg['aid']} - {pkg['title'][:30]}...")

        result = run_workshop_c_with_ai(
            pkg=pkg,
            prompts_dir=prompts_dir,
            ai_output_dir=ai_output_dir,
            config=config,
            log_conn=log_conn,
            batch_id=batch_id,
        )

        results.append(result)

        if result.success:
            print(f"    ✓ 完成: {result.ppthub_category}, {result.language} ({result.duration_ms}ms)")
        else:
            print(f"    ✗ 失败: {result.error_message}")

    # 打印详细结果
    print(f"\n{'='*60}")
    print("详细结果")
    print(f"{'='*60}")

    for result in results:
        print_result_details(result)

    # 打印汇总
    print_summary(results, batch_id)

    # 关闭日志数据库
    log_conn.close()

    # 显示输出文件
    print(f"\n{'='*60}")
    print("输出文件列表")
    print(f"{'='*60}")

    print("\nPrompt 文件:")
    for p in sorted(prompts_dir.glob('**/prompt.md')):
        print(f"  {p.relative_to(work_dir)}")

    print("\nAI 输出文件:")
    for p in sorted(ai_output_dir.glob('**/output.json')):
        print(f"  {p.relative_to(work_dir)}")

    print(f"\n日志数据库: {logs_dir / 'ai_call_log.db'}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
