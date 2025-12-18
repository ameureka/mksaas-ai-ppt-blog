"""PPT 分析模块"""
import subprocess
from pathlib import Path
from typing import Optional

LIBREOFFICE_PATH = '/Applications/LibreOffice.app/Contents/MacOS/soffice'
BACKUP_KEYWORDS = ['备份', '副本', 'backup', 'copy', 'Backup', 'Copy']


class SlideAnalyzer:
    def find_best_ppt(self, extracted_dir: str) -> Optional[str]:
        """
        从解压目录中选择最佳 PPT 文件
        
        优先级:
        1. .pptx 优先于 .ppt
        2. 文件大小最大的优先
        3. 排除包含 "备份"、"副本" 等关键词的文件
        """
        ppt_files = []
        for ext in ['*.pptx', '*.ppt', '*.PPTX', '*.PPT']:
            ppt_files.extend(Path(extracted_dir).rglob(ext))
        
        if not ppt_files:
            return None
        
        def score(f: Path) -> tuple:
            is_pptx = f.suffix.lower() == '.pptx'
            is_backup = any(kw in f.name for kw in BACKUP_KEYWORDS)
            size = f.stat().st_size
            return (not is_backup, is_pptx, size)
        
        best = max(ppt_files, key=score)
        return str(best)

    def get_slide_count(self, ppt_path: str, temp_dir: str) -> int:
        """
        获取 PPT 页数
        
        策略:
        1. 如果是 .pptx，用 python-pptx 直接读取
        2. 如果是 .ppt，先用 LibreOffice 转换为 .pptx
        3. 如果 python-pptx 失败，用 LibreOffice 导出 PNG 计数
        4. 全部失败返回 -1
        """
        ppt = Path(ppt_path)
        
        # 策略 1 & 2: python-pptx
        try:
            pptx_path = ppt_path
            if ppt.suffix.lower() == '.ppt':
                pptx_path = self._convert_to_pptx(ppt_path, temp_dir)
                if not pptx_path:
                    raise Exception("转换失败")
            
            from pptx import Presentation
            prs = Presentation(pptx_path)
            return len(prs.slides)
        except Exception:
            pass
        
        # 策略 3: LibreOffice PNG 导出计数
        try:
            count = self._count_via_png_export(ppt_path, temp_dir)
            if count >= 0:
                return count
        except Exception:
            pass
        
        return -1

    def _convert_to_pptx(self, ppt_path: str, temp_dir: str) -> Optional[str]:
        """使用 LibreOffice 将 .ppt 转换为 .pptx"""
        try:
            result = subprocess.run(
                [LIBREOFFICE_PATH, '--headless', '--convert-to', 'pptx', '--outdir', temp_dir, ppt_path],
                capture_output=True,
                timeout=60,
                text=True
            )
            if result.returncode != 0:
                return None
            
            base_name = Path(ppt_path).stem
            pptx_path = Path(temp_dir) / f"{base_name}.pptx"
            return str(pptx_path) if pptx_path.exists() else None
        except Exception:
            return None

    def _count_via_png_export(self, ppt_path: str, temp_dir: str) -> int:
        """通过 LibreOffice 导出 PNG 来计数页数"""
        png_dir = Path(temp_dir) / 'png_count'
        png_dir.mkdir(exist_ok=True)
        
        try:
            result = subprocess.run(
                [LIBREOFFICE_PATH, '--headless', '--convert-to', 'png', '--outdir', str(png_dir), ppt_path],
                capture_output=True,
                timeout=120,
                text=True
            )
            if result.returncode != 0:
                return -1
            
            png_files = list(png_dir.glob('*.png'))
            return len(png_files)
        except Exception:
            return -1
