"""解压模块"""
import subprocess
from pathlib import Path

from .models import ExtractResult


class ArchiveExtractor:
    TIMEOUT = 120  # 秒

    def extract(self, archive_path: str, temp_dir: str) -> ExtractResult:
        """
        解压压缩包到临时目录
        
        Args:
            archive_path: 压缩包绝对路径
            temp_dir: 临时目录路径
            
        Returns:
            ExtractResult: 包含 success, extracted_dir, error_msg
        """
        archive = Path(archive_path)
        if not archive.exists():
            return ExtractResult(success=False, error_msg=f"文件不存在: {archive_path}")

        try:
            result = subprocess.run(
                ['unar', '-o', temp_dir, '-f', archive_path],
                capture_output=True,
                timeout=self.TIMEOUT,
                text=True
            )
            if result.returncode != 0:
                return ExtractResult(
                    success=False,
                    error_msg=f"unar 返回错误: {result.stderr or result.stdout}"
                )
            
            # unar 会创建一个与压缩包同名的子目录，或直接解压到目标目录
            # 查找解压后的目录
            extracted_items = list(Path(temp_dir).iterdir())
            if not extracted_items:
                return ExtractResult(success=False, error_msg="解压后目录为空")
            
            # 如果只有一个子目录，返回该子目录；否则返回 temp_dir
            if len(extracted_items) == 1 and extracted_items[0].is_dir():
                extracted_dir = str(extracted_items[0])
            else:
                extracted_dir = temp_dir
            
            return ExtractResult(success=True, extracted_dir=extracted_dir)

        except subprocess.TimeoutExpired:
            return ExtractResult(success=False, error_msg=f"解压超时 ({self.TIMEOUT}s)")
        except FileNotFoundError:
            return ExtractResult(success=False, error_msg="unar 命令未找到，请安装: brew install unar")
        except Exception as e:
            return ExtractResult(success=False, error_msg=str(e))
