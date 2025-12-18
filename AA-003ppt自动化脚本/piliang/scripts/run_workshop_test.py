#!/usr/bin/env python3
"""
Workshop 0-C 实际执行测试脚本
选择 5 个文件，依次执行 Workshop 0 (Ingest) 到 Workshop C (AI Enrich)
"""

from __future__ import annotations

import json
import shutil
import sqlite3
import sys
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / 'src'))

from factory.config import load_factory_config, FactoryConfig
from factory.types import StandardInputPackage, EtlOutput, CleanOutput
from factory.workshops.workshopA import WorkshopA, WorkshopAConfig
from factory.workshops.workshopB import WorkshopB, WorkshopBConfig


@dataclass
class TestResult:
    """测试结果"""
    workshop: str
    aid: str
    success: bool
    message: str
    duration_ms: int = 0


def setup_test_environment(tmp_dir: Path) -> tuple[Path, Path, sqlite3.Connection]:
    """设置测试环境"""
    # 创建目录结构
    input_dir = tmp_dir / 'input_raw'
    output_dir = tmp_dir / 'output'
    db_path = tmp_dir / 'test_assets.db'

    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'clean').mkdir(exist_ok=True)
    (output_dir / 'etl').mkdir(exist_ok=True)

    # 创建数据库
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 创建表结构
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS processed_assets (
            aid TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            title TEXT,
            original_tags TEXT,
            local_pptx_path TEXT,
            local_cover_path TEXT,
            slide_count INTEGER,
            file_size_bytes INTEGER,
            ai_summary TEXT,
            ai_keywords TEXT,
            ai_scenario TEXT,
            ai_color_scheme TEXT,
            ai_structure_features TEXT,
            ai_template_features TEXT,
            ppthub_category TEXT,
            language TEXT,
            stage_status TEXT DEFAULT 'pending',
            tags_final TEXT,
            description_final TEXT,
            author TEXT,
            language_source TEXT,
            category_source TEXT,
            ai_fallback_reason TEXT,
            source_batch_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_stage_status ON processed_assets(stage_status);
        CREATE INDEX IF NOT EXISTS idx_channel_id ON processed_assets(channel_id);
    ''')
    conn.commit()

    return input_dir, output_dir, conn


def select_test_files(downloads_dir: Path, count: int = 5) -> list[Path]:
    """选择测试文件"""
    zip_files = list(downloads_dir.glob('**/*.zip'))

    # 选择前 count 个文件
    selected = zip_files[:count]

    print(f"\n选择的测试文件 ({len(selected)} 个):")
    for i, f in enumerate(selected, 1):
        print(f"  {i}. {f.name}")

    return selected


def prepare_input_packages(
    zip_files: list[Path],
    input_dir: Path,
    conn: sqlite3.Connection,
) -> list[dict]:
    """准备输入包（解压 zip 文件并创建 meta.json）"""
    packages = []
    cursor = conn.cursor()

    for zip_path in zip_files:
        # 从文件名提取 aid 和 title
        filename = zip_path.stem
        parts = filename.split('-', 1)
        aid = parts[0] if parts else filename[:6]
        title = parts[1] if len(parts) > 1 else filename

        # 确定 channel_id
        channel_id = zip_path.parent.name

        # 创建输入目录
        asset_dir = input_dir / channel_id / aid
        asset_dir.mkdir(parents=True, exist_ok=True)

        # 解压 zip 文件
        try:
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(asset_dir)

            # 查找 pptx 文件
            pptx_files = list(asset_dir.glob('*.pptx'))
            if not pptx_files:
                print(f"  警告: {aid} 没有找到 pptx 文件")
                continue

            # 重命名为 main.pptx
            main_pptx = asset_dir / 'main.pptx'
            if not main_pptx.exists():
                pptx_files[0].rename(main_pptx)

            # 创建 meta.json
            meta = {
                'aid': aid,
                'title': title,
                'channel_id': channel_id,
                'tags': [],
                'source_url': f'https://example.com/{channel_id}/{aid}',
                'crawled_at': datetime.now().isoformat(),
            }
            meta_path = asset_dir / 'meta.json'
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')

            # 插入数据库记录
            cursor.execute('''
                INSERT OR REPLACE INTO processed_assets (aid, channel_id, title, stage_status)
                VALUES (?, ?, ?, ?)
            ''', (aid, channel_id, title, 'pending'))

            packages.append({
                'aid': aid,
                'channel_id': channel_id,
                'title': title,
                'asset_dir': asset_dir,
                'pptx_path': main_pptx,
                'meta_path': meta_path,
                'tags': [],
            })

            print(f"  准备完成: {aid} - {title[:30]}...")

        except Exception as e:
            print(f"  错误: {aid} 解压失败 - {e}")

    conn.commit()
    return packages


def run_workshop_0(
    packages: list[dict],
    input_dir: Path,
    conn: sqlite3.Connection,
    config: FactoryConfig,
) -> list[TestResult]:
    """运行 Workshop 0 (Ingest)"""
    print("\n" + "=" * 60)
    print("Workshop 0: Ingest (资产发现与导入)")
    print("=" * 60)

    results = []
    cursor = conn.cursor()

    for pkg in packages:
        aid = pkg['aid']
        start = datetime.now()

        try:
            # Workshop 0 主要是发现和导入，这里我们已经手动准备好了
            # 更新状态为 ws0_done
            cursor.execute('''
                UPDATE processed_assets
                SET stage_status = 'ws0_done',
                    local_pptx_path = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE aid = ?
            ''', (str(pkg['pptx_path']), aid))

            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='Workshop0',
                aid=aid,
                success=True,
                message='Ingest 完成',
                duration_ms=duration,
            ))
            print(f"  ✓ {aid}: Ingest 完成 ({duration}ms)")

        except Exception as e:
            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='Workshop0',
                aid=aid,
                success=False,
                message=str(e),
                duration_ms=duration,
            ))
            print(f"  ✗ {aid}: {e}")

    conn.commit()
    return results


def run_workshop_a(
    packages: list[dict],
    output_dir: Path,
    conn: sqlite3.Connection,
    config: FactoryConfig,
) -> list[TestResult]:
    """运行 Workshop A (ETL)"""
    print("\n" + "=" * 60)
    print("Workshop A: ETL (提取、转换、加载)")
    print("=" * 60)

    results = []
    cursor = conn.cursor()

    ws_config = WorkshopAConfig(
        output_dir=output_dir / 'etl',
    )
    workshop = WorkshopA(ws_config)

    for pkg in packages:
        aid = pkg['aid']
        start = datetime.now()

        try:
            # 创建 StandardInputPackage
            input_pkg = StandardInputPackage(
                aid=aid,
                channel_id=pkg['channel_id'],
                root_dir=pkg['asset_dir'],
                main_pptx_path=pkg['pptx_path'],
                meta_path=pkg['meta_path'],
                cover_path=None,
            )

            # 执行 ETL
            etl_output = workshop.etl(input_pkg)

            # 更新数据库
            cursor.execute('''
                UPDATE processed_assets
                SET stage_status = 'wsA_done',
                    slide_count = ?,
                    file_size_bytes = ?,
                    title = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE aid = ?
            ''', (
                etl_output.pages_count,
                etl_output.file_size_kb * 1024,
                pkg['title'],
                aid,
            ))

            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='WorkshopA',
                aid=aid,
                success=True,
                message=f'ETL 完成: {etl_output.pages_count} 页, {etl_output.file_size_kb} KB',
                duration_ms=duration,
            ))
            print(f"  ✓ {aid}: {etl_output.pages_count} 页, {etl_output.file_size_kb} KB ({duration}ms)")

            # 更新包信息
            pkg['etl_output'] = etl_output

        except Exception as e:
            import traceback
            traceback.print_exc()
            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='WorkshopA',
                aid=aid,
                success=False,
                message=str(e),
                duration_ms=duration,
            ))
            print(f"  ✗ {aid}: {e}")

    conn.commit()
    return results


def run_workshop_b(
    packages: list[dict],
    output_dir: Path,
    conn: sqlite3.Connection,
    config: FactoryConfig,
) -> list[TestResult]:
    """运行 Workshop B (Deep Clean)"""
    print("\n" + "=" * 60)
    print("Workshop B: Deep Clean (深度清洗)")
    print("=" * 60)

    results = []
    cursor = conn.cursor()

    ws_config = WorkshopBConfig(
        output_dir=output_dir / 'clean',
        forbidden_keywords=config.forbidden_keywords,
        brand_replacements=config.brand_replacements,
    )
    workshop = WorkshopB(ws_config)

    for pkg in packages:
        aid = pkg['aid']

        if 'etl_output' not in pkg:
            print(f"  跳过 {aid}: 没有 ETL 输出")
            continue

        start = datetime.now()

        try:
            etl_output = pkg['etl_output']

            # 执行清洗
            clean_output = workshop.deep_clean(etl_output)

            # 计算清洗后的页数
            import zipfile
            import re
            slide_re = re.compile(r'^ppt/slides/slide\d+\.xml$')
            with zipfile.ZipFile(clean_output.clean_pptx_path) as zf:
                clean_slide_count = sum(1 for n in zf.namelist() if slide_re.match(n))

            # 更新数据库
            cursor.execute('''
                UPDATE processed_assets
                SET stage_status = 'wsB_done',
                    slide_count = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE aid = ?
            ''', (clean_slide_count, aid))

            duration = int((datetime.now() - start).total_seconds() * 1000)

            removed = etl_output.pages_count - clean_slide_count
            results.append(TestResult(
                workshop='WorkshopB',
                aid=aid,
                success=True,
                message=f'清洗完成: 移除 {removed} 页, 剩余 {clean_slide_count} 页',
                duration_ms=duration,
            ))
            print(f"  ✓ {aid}: 移除 {removed} 页, 剩余 {clean_slide_count} 页 ({duration}ms)")

            # 更新包信息
            pkg['clean_output'] = clean_output
            pkg['clean_slide_count'] = clean_slide_count

        except Exception as e:
            import traceback
            traceback.print_exc()
            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='WorkshopB',
                aid=aid,
                success=False,
                message=str(e),
                duration_ms=duration,
            ))
            print(f"  ✗ {aid}: {e}")

    conn.commit()
    return results


def run_workshop_c(
    packages: list[dict],
    conn: sqlite3.Connection,
    config: FactoryConfig,
) -> list[TestResult]:
    """运行 Workshop C (AI Enrich) - 跳过实际 AI 调用，使用规则引擎"""
    print("\n" + "=" * 60)
    print("Workshop C: AI Enrich (AI 增强) - 使用规则引擎")
    print("=" * 60)

    results = []
    cursor = conn.cursor()

    for pkg in packages:
        aid = pkg['aid']

        if 'clean_output' not in pkg:
            print(f"  跳过 {aid}: 没有 Clean 输出")
            continue

        start = datetime.now()

        try:
            clean_output = pkg['clean_output']

            # 使用规则引擎进行分类（跳过实际 AI 调用）
            from factory.rules import RuleEngine, RuleEngineConfig
            from factory.ai import (
                LanguageDetector,
                TagsNormalizer,
                DescriptionBuilder,
                TextExtractor,
            )

            # 提取文本
            text_extractor = TextExtractor()
            extracted = text_extractor.extract(clean_output.clean_pptx_path)

            # 检测语言 - 使用 full_text 字符串
            lang_detector = LanguageDetector()
            lang_result = lang_detector.detect(extracted.full_text)

            # 规则引擎分类
            mapping_path = PROJECT_ROOT / 'configs' / 'category-mapping.yaml'
            category = None
            if mapping_path.exists():
                rule_engine = RuleEngine(RuleEngineConfig(mapping_path=mapping_path))
                category = rule_engine.match(
                    title=pkg['title'],
                    tags=pkg.get('tags', []),
                )

            if not category:
                category = 'general'
                category_source = 'fallback'
            else:
                category_source = 'rule'

            # 标签标准化
            tags_normalizer = TagsNormalizer(
                forbidden_keywords=config.forbidden_keywords,
            )
            normalized_tags = tags_normalizer.normalize(
                original_tags=pkg.get('tags', []),
                ai_keywords=[],
                title=pkg['title'],
            )

            # 构建描述
            desc_builder = DescriptionBuilder(
                forbidden_keywords=config.forbidden_keywords,
            )
            description_result = desc_builder.build(
                title=pkg['title'],
                ai_summary='',
                ai_scenario='',
                ai_structure_features='',
            )

            # 更新数据库
            cursor.execute('''
                UPDATE processed_assets
                SET stage_status = 'wsC_done',
                    ppthub_category = ?,
                    language = ?,
                    language_source = ?,
                    category_source = ?,
                    tags_final = ?,
                    description_final = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE aid = ?
            ''', (
                category,
                lang_result.display,
                lang_result.source,
                category_source,
                json.dumps(normalized_tags.tags, ensure_ascii=False),
                description_result.description,
                aid,
            ))

            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='WorkshopC',
                aid=aid,
                success=True,
                message=f'AI Enrich 完成: {category} ({category_source}), {lang_result.display}',
                duration_ms=duration,
            ))
            print(f"  ✓ {aid}: 分类={category} ({category_source}), 语言={lang_result.display} ({duration}ms)")

        except Exception as e:
            import traceback
            traceback.print_exc()
            duration = int((datetime.now() - start).total_seconds() * 1000)
            results.append(TestResult(
                workshop='WorkshopC',
                aid=aid,
                success=False,
                message=str(e),
                duration_ms=duration,
            ))
            print(f"  ✗ {aid}: {e}")

    conn.commit()
    return results


def print_summary(all_results: list[TestResult]) -> None:
    """打印测试摘要"""
    print("\n" + "=" * 60)
    print("测试摘要")
    print("=" * 60)

    # 按 workshop 分组
    by_workshop: dict[str, list[TestResult]] = {}
    for r in all_results:
        if r.workshop not in by_workshop:
            by_workshop[r.workshop] = []
        by_workshop[r.workshop].append(r)

    total_success = 0
    total_failed = 0
    total_duration = 0

    for ws_name in ['Workshop0', 'WorkshopA', 'WorkshopB', 'WorkshopC']:
        if ws_name not in by_workshop:
            continue

        ws_results = by_workshop[ws_name]
        success = sum(1 for r in ws_results if r.success)
        failed = sum(1 for r in ws_results if not r.success)
        duration = sum(r.duration_ms for r in ws_results)

        total_success += success
        total_failed += failed
        total_duration += duration

        print(f"\n{ws_name}:")
        print(f"  成功: {success}, 失败: {failed}, 耗时: {duration}ms")

    print(f"\n总计:")
    print(f"  成功: {total_success}, 失败: {total_failed}")
    print(f"  总耗时: {total_duration}ms ({total_duration / 1000:.2f}s)")


def main() -> int:
    """主函数"""
    print("=" * 60)
    print("Piliang 工厂 Workshop 0-C 实际执行测试")
    print("=" * 60)

    # 加载配置
    config = load_factory_config(project_root=PROJECT_ROOT)
    print(f"\n项目根目录: {PROJECT_ROOT}")
    print(f"敏感词数量: {len(config.forbidden_keywords)}")

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

    # 创建临时测试目录
    test_dir = PROJECT_ROOT / 'data' / 'workshop_test_run'
    if test_dir.exists():
        shutil.rmtree(test_dir)
    test_dir.mkdir(parents=True)

    print(f"\n测试目录: {test_dir}")

    # 设置测试环境
    input_dir, output_dir, conn = setup_test_environment(test_dir)

    try:
        # 准备输入包
        print("\n准备输入包...")
        packages = prepare_input_packages(zip_files, input_dir, conn)

        if not packages:
            print("\n错误: 没有成功准备任何输入包")
            return 1

        all_results: list[TestResult] = []

        # 运行 Workshop 0
        results_0 = run_workshop_0(packages, input_dir, conn, config)
        all_results.extend(results_0)

        # 运行 Workshop A
        results_a = run_workshop_a(packages, output_dir, conn, config)
        all_results.extend(results_a)

        # 运行 Workshop B
        results_b = run_workshop_b(packages, output_dir, conn, config)
        all_results.extend(results_b)

        # 运行 Workshop C
        results_c = run_workshop_c(packages, conn, config)
        all_results.extend(results_c)

        # 打印摘要
        print_summary(all_results)

        # 显示最终数据库状态
        print("\n" + "=" * 60)
        print("数据库最终状态")
        print("=" * 60)

        cursor = conn.cursor()
        cursor.execute('''
            SELECT aid, channel_id, title, slide_count, ppthub_category, language, stage_status
            FROM processed_assets
        ''')

        for row in cursor.fetchall():
            print(f"\n{row['aid']}:")
            print(f"  标题: {row['title'][:40] if row['title'] else 'N/A'}...")
            print(f"  频道: {row['channel_id']}")
            print(f"  页数: {row['slide_count']}")
            print(f"  分类: {row['ppthub_category']}")
            print(f"  语言: {row['language']}")
            print(f"  状态: {row['stage_status']}")

        return 0

    finally:
        conn.close()


if __name__ == '__main__':
    sys.exit(main())
