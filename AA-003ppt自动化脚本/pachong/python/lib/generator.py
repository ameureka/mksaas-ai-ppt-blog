"""封面生成模块"""
import subprocess
import threading
from pathlib import Path
from typing import List

from PIL import Image

LIBREOFFICE_PATH = '/Applications/LibreOffice.app/Contents/MacOS/soffice'

# LibreOffice 不支持并发，使用锁
_libreoffice_lock = threading.Lock()


class CoverGenerator:
    def __init__(self, webp_quality: int = 85):
        self.webp_quality = webp_quality

    def export_slides(self, ppt_path: str, output_dir: str, max_slides: int = 5) -> List[str]:
        """
        导出 PPT 页面为 PNG
        
        注意: LibreOffice 会导出所有页面，我们只取前 max_slides 个
        """
        with _libreoffice_lock:
            try:
                result = subprocess.run(
                    [LIBREOFFICE_PATH, '--headless', '--convert-to', 'png', '--outdir', output_dir, ppt_path],
                    capture_output=True,
                    timeout=120,
                    text=True
                )
                if result.returncode != 0:
                    return []
                
                # LibreOffice 导出的 PNG 文件名格式: {basename}.png 或 {basename}-{n}.png
                png_files = sorted(Path(output_dir).glob('*.png'))
                return [str(f) for f in png_files[:max_slides]]
            except Exception:
                return []

    def generate_cover(self, png_path: str, output_path: str) -> bool:
        """
        生成列表页封面 (640×360, 16:9 裁切)
        """
        try:
            img = Image.open(png_path)
            img = self._crop_to_16_9(img)
            img = img.resize((640, 360), Image.Resampling.LANCZOS)
            img.save(output_path, 'WEBP', quality=self.webp_quality)
            return True
        except Exception:
            return False

    def generate_preview(self, png_path: str, output_path: str, is_first: bool) -> bool:
        """
        生成详情页预览图
        
        is_first=True: 1920×1080, 16:9 裁切
        is_first=False: 原比例, 最大宽度 1920px
        """
        try:
            img = Image.open(png_path)
            
            if is_first:
                img = self._crop_to_16_9(img)
                img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
            else:
                if img.width > 1920:
                    ratio = 1920 / img.width
                    new_size = (1920, int(img.height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            img.save(output_path, 'WEBP', quality=self.webp_quality)
            return True
        except Exception:
            return False

    def _crop_to_16_9(self, img: Image.Image) -> Image.Image:
        """居中裁切为 16:9"""
        target_ratio = 16 / 9
        current_ratio = img.width / img.height
        
        if current_ratio > target_ratio:
            # 太宽，裁左右
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            return img.crop((left, 0, left + new_width, img.height))
        else:
            # 太高，裁上下
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 2
            return img.crop((0, top, img.width, top + new_height))
