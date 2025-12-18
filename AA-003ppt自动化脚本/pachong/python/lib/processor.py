"""核心处理器"""
import logging
import re
import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import List, Optional

from .analyzer import SlideAnalyzer
from .db import ProcessDB
from .extractor import ArchiveExtractor
from .generator import CoverGenerator
from .models import ProcessorConfig, ProcessResult, SingleResult, Status

logger = logging.getLogger(__name__)


class PPTProcessor:
    def __init__(self, config: ProcessorConfig):
        self.config = config
        self.db = ProcessDB(config.db_path)
        self.extractor = ArchiveExtractor()
        self.analyzer = SlideAnalyzer()
        self.generator = CoverGenerator(config.webp_quality)

    @contextmanager
    def _temp_workspace(self):
        """创建临时工作目录，自动清理"""
        temp_dir = tempfile.mkdtemp(prefix='ppt_process_')
        try:
            yield temp_dir
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _extract_aid(self, archive_path: str) -> Optional[str]:
        """从文件名提取 AID"""
        name = Path(archive_path).stem
        match = re.match(r'^(\d+)-', name)
        return match.group(1) if match else None

    def _get_archive_files(self, channel: str) -> List[str]:
        """获取频道下所有压缩文件"""
        channel_dir = Path(self.config.downloads_dir) / channel
        if not channel_dir.exists():
            return []
        
        files = []
        for ext in ['*.zip', '*.rar', '*.ZIP', '*.RAR']:
            files.extend(channel_dir.glob(ext))
        return [str(f) for f in sorted(files)]

    def cleanup_old_cover(self, images_dir: str, aid: str) -> bool:
        """清理旧封面文件"""
        old_cover = Path(images_dir) / f"{aid}-cover.jpg"
        try:
            if old_cover.exists():
                old_cover.unlink()
                logger.info(f"删除旧封面: {old_cover}")
            return True
        except Exception as e:
            logger.warning(f"删除旧封面失败: {e}")
            return True  # 幂等性：即使失败也返回 True

    def process_single(self, archive_path: str, channel: str, dry_run: bool = False) -> SingleResult:
        """处理单个资源"""
        aid = self._extract_aid(archive_path)
        if not aid:
            return SingleResult(aid='unknown', success=False, status=Status.FAILED, error_msg="无法提取 AID")

        # 检查是否已处理
        existing = self.db.get_status(aid)
        if existing and existing.status in (Status.COMPLETED, Status.ARCHIVED):
            logger.info(f"[{aid}] 已处理，跳过")
            return SingleResult(aid=aid, success=True, status=existing.status, slide_count=existing.slide_count)

        if dry_run:
            logger.info(f"[{aid}] DRY-RUN: 将处理 {archive_path}")
            return SingleResult(aid=aid, success=True, status=Status.PENDING)

        self.db.mark_processing(aid, channel)

        with self._temp_workspace() as temp_dir:
            try:
                # 1. 解压
                extract_result = self.extractor.extract(archive_path, temp_dir)
                if not extract_result.success:
                    self.db.mark_failed(aid, channel, extract_result.error_msg or "解压失败")
                    return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg=extract_result.error_msg)

                # 2. 查找 PPT
                ppt_path = self.analyzer.find_best_ppt(extract_result.extracted_dir)
                if not ppt_path:
                    self.db.mark_failed(aid, channel, "未找到 PPT 文件")
                    return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg="未找到 PPT 文件")

                # 3. 读取页数
                slide_count = self.analyzer.get_slide_count(ppt_path, temp_dir)
                if slide_count == -1:
                    self.db.mark_failed(aid, channel, "无法读取页数")
                    return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg="无法读取页数")

                logger.info(f"[{aid}] 页数: {slide_count}")

                # 4. 质量筛选
                if slide_count < self.config.min_slides:
                    self._archive_resource(archive_path, aid, channel)
                    self.db.mark_archived(aid, channel, slide_count)
                    logger.info(f"[{aid}] 页数不足 ({slide_count} < {self.config.min_slides})，已归档")
                    return SingleResult(aid=aid, success=True, status=Status.ARCHIVED, slide_count=slide_count)

                # 5. 导出 PNG
                png_dir = Path(temp_dir) / 'png'
                png_dir.mkdir()
                png_files = self.generator.export_slides(ppt_path, str(png_dir), max_slides=5)
                if not png_files:
                    self.db.mark_failed(aid, channel, "PNG 导出失败")
                    return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg="PNG 导出失败")

                # 6. 生成封面和预览图
                images_dir = Path(self.config.downloads_dir) / channel / 'images'
                images_dir.mkdir(exist_ok=True)

                preview_paths = []
                
                # 封面
                cover_path = images_dir / f"{aid}-cover.webp"
                if not self.generator.generate_cover(png_files[0], str(cover_path)):
                    self.db.mark_failed(aid, channel, "封面生成失败")
                    return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg="封面生成失败")

                # 预览图
                for i, png_file in enumerate(png_files):
                    preview_path = images_dir / f"{aid}-preview_{i+1}.webp"
                    is_first = (i == 0)
                    if self.generator.generate_preview(png_file, str(preview_path), is_first):
                        preview_paths.append(str(preview_path))

                # 7. 清理旧封面
                self.cleanup_old_cover(str(images_dir), aid)

                # 8. 标记完成
                self.db.mark_completed(aid, channel, slide_count, preview_paths)
                logger.info(f"[{aid}] 处理完成，生成 {len(preview_paths)} 张预览图")
                return SingleResult(aid=aid, success=True, status=Status.COMPLETED, slide_count=slide_count)

            except Exception as e:
                self.db.mark_failed(aid, channel, str(e))
                logger.error(f"[{aid}] 处理异常: {e}")
                return SingleResult(aid=aid, success=False, status=Status.FAILED, error_msg=str(e))

    def _archive_resource(self, archive_path: str, aid: str, channel: str):
        """将不合格资源移动到归档目录"""
        archive_dir = Path(self.config.archive_dir) / channel
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        # 移动压缩包
        src = Path(archive_path)
        dst = archive_dir / src.name
        if src.exists():
            shutil.move(str(src), str(dst))
        
        # 移动旧封面
        images_dir = Path(self.config.downloads_dir) / channel / 'images'
        old_cover = images_dir / f"{aid}-cover.jpg"
        if old_cover.exists():
            archive_images = archive_dir / 'images'
            archive_images.mkdir(exist_ok=True)
            shutil.move(str(old_cover), str(archive_images / old_cover.name))

    def process_channel(self, channel: str, limit: Optional[int] = None, dry_run: bool = False) -> ProcessResult:
        """处理指定频道的所有资源"""
        result = ProcessResult()
        archive_files = self._get_archive_files(channel)
        
        if limit:
            archive_files = archive_files[:limit]
        
        result.total = len(archive_files)
        logger.info(f"开始处理 {channel}，共 {result.total} 个文件")

        for i, archive_path in enumerate(archive_files):
            aid = self._extract_aid(archive_path)
            logger.info(f"[{i+1}/{result.total}] 处理 {aid}")
            
            single_result = self.process_single(archive_path, channel, dry_run)
            
            if single_result.status == Status.COMPLETED:
                result.completed += 1
            elif single_result.status == Status.ARCHIVED:
                result.archived += 1
            elif single_result.status == Status.FAILED:
                result.failed += 1
            else:
                result.skipped += 1

        logger.info(f"处理完成: 成功 {result.completed}, 归档 {result.archived}, 失败 {result.failed}, 跳过 {result.skipped}")
        return result

    def retry_failed(self, channel: Optional[str] = None, limit: Optional[int] = None) -> ProcessResult:
        """重试失败的任务"""
        count = self.db.reset_failed_to_pending(channel)
        logger.info(f"重置 {count} 个失败任务为待处理")
        
        if channel:
            return self.process_channel(channel, limit)
        return ProcessResult()

    def get_stats(self, channel: Optional[str] = None) -> dict:
        """获取处理统计"""
        return self.db.get_stats(channel)
