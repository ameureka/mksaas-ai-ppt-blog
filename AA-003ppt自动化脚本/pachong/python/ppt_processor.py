#!/usr/bin/env python3
"""PPT 批量处理脚本

用法:
    python ppt_processor.py --channel ppt_jieri --limit 10
    python ppt_processor.py --channel ppt_jieri --dry-run
    python ppt_processor.py --stats
    python ppt_processor.py --retry-failed --channel ppt_jieri
"""
import argparse
import logging
import sys
from pathlib import Path

from lib.models import ProcessorConfig
from lib.processor import PPTProcessor

# 默认路径配置
DEFAULT_DOWNLOADS_DIR = Path(__file__).parent.parent / 'downloads'
DEFAULT_ARCHIVE_DIR = DEFAULT_DOWNLOADS_DIR / 'archive'
DEFAULT_DB_PATH = Path(__file__).parent / 'data' / 'process.db'


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(Path(__file__).parent / 'logs' / 'process.log', encoding='utf-8')
        ]
    )


def main():
    parser = argparse.ArgumentParser(description='PPT 批量处理脚本')
    parser.add_argument('--channel', type=str, help='指定处理的频道 (ppt_jieri, ppt_xiazai, ppt_moban, ppt_hangye)')
    parser.add_argument('--limit', type=int, help='限制处理数量')
    parser.add_argument('--dry-run', action='store_true', help='模拟运行，不实际修改文件')
    parser.add_argument('--min-slides', type=int, default=10, help='最小页数阈值 (默认 10)')
    parser.add_argument('--stats', action='store_true', help='显示处理统计')
    parser.add_argument('--retry-failed', action='store_true', help='重试失败的任务')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    parser.add_argument('--downloads-dir', type=str, default=str(DEFAULT_DOWNLOADS_DIR), help='下载目录路径')
    parser.add_argument('--archive-dir', type=str, default=str(DEFAULT_ARCHIVE_DIR), help='归档目录路径')
    parser.add_argument('--db-path', type=str, default=str(DEFAULT_DB_PATH), help='数据库路径')

    args = parser.parse_args()
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)

    # 创建配置
    config = ProcessorConfig(
        downloads_dir=args.downloads_dir,
        archive_dir=args.archive_dir,
        db_path=args.db_path,
        min_slides=args.min_slides
    )

    processor = PPTProcessor(config)

    # 显示统计
    if args.stats:
        stats = processor.get_stats(args.channel)
        print("\n=== 处理统计 ===")
        if args.channel:
            print(f"频道: {args.channel}")
        for status, count in sorted(stats.items()):
            print(f"  {status}: {count}")
        total = sum(stats.values())
        print(f"  总计: {total}")
        return 0

    # 重试失败
    if args.retry_failed:
        if not args.channel:
            logger.error("--retry-failed 需要指定 --channel")
            return 1
        result = processor.retry_failed(args.channel, args.limit)
        return 0 if result.failed == 0 else 1

    # 处理频道
    if args.channel:
        result = processor.process_channel(args.channel, args.limit, args.dry_run)
        print(f"\n=== 处理结果 ===")
        print(f"  总数: {result.total}")
        print(f"  成功: {result.completed}")
        print(f"  归档: {result.archived}")
        print(f"  失败: {result.failed}")
        print(f"  跳过: {result.skipped}")
        return 0 if result.failed == 0 else 1

    # 无参数时显示帮助
    parser.print_help()
    return 0


if __name__ == '__main__':
    sys.exit(main())
