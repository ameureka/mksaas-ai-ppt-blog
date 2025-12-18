from __future__ import annotations

import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import CleanOutput, StageRecord


LIBREOFFICE_PATH = (
	shutil.which('soffice')
	or '/Applications/LibreOffice.app/Contents/MacOS/soffice'
)


class CoverError(Exception):
	def __init__(self, code: str, message: str) -> None:
		self.code = code
		self.message = message
		super().__init__(f'{code}: {message}')


@dataclass(frozen=True)
class WorkshopCoverConfig:
	output_dir: Path
	format: str = 'webp'
	quality: int = 85


class WorkshopCover:
	def __init__(self, config: WorkshopCoverConfig) -> None:
		self._config = config

	@staticmethod
	def _crop_to_16_9(img: Image.Image) -> Image.Image:
		"""
		Center-crop an image to 16:9 aspect ratio.
		"""
		target = 16 / 9
		w, h = img.size
		if w <= 0 or h <= 0:
			return img
		current = w / h
		if abs(current - target) < 1e-6:
			return img
		if current > target:
			new_w = int(h * target)
			left = max(0, int((w - new_w) / 2))
			return img.crop((left, 0, left + new_w, h))
		new_h = int(w / target)
		top = max(0, int((h - new_h) / 2))
		return img.crop((0, top, w, top + new_h))

	def _generate_image(self, src_png: Path, output_path: Path, size: tuple[int, int]) -> bool:
		"""
		Generate a resized 16:9 image in configured format.
		"""
		output_path.parent.mkdir(parents=True, exist_ok=True)
		img = Image.open(src_png)
		img = img.convert('RGB')
		img = self._crop_to_16_9(img)
		img = img.resize(size, Image.LANCZOS)

		fmt = self._config.format.lower()
		if fmt == 'webp':
			img.save(output_path, 'WEBP', quality=self._config.quality)
		elif fmt in {'jpg', 'jpeg'}:
			img.save(output_path, 'JPEG', quality=self._config.quality, optimize=True)
		elif fmt == 'png':
			img.save(output_path, 'PNG')
		else:
			# Fall back to webp for unknown formats.
			img.save(output_path, 'WEBP', quality=self._config.quality)
		return True

	@staticmethod
	def _resolve_libreoffice() -> str | None:
		if not LIBREOFFICE_PATH:
			return None
		p = Path(LIBREOFFICE_PATH)
		if p.is_absolute() and p.exists():
			return str(p)
		found = shutil.which(LIBREOFFICE_PATH)
		return found

	def _export_first_slide(self, pptx_path: Path, out_dir: Path) -> Path:
		"""
		Export slides to PNG via LibreOffice and return the first PNG path.
		"""
		lo = self._resolve_libreoffice()
		if not lo or not Path(lo).exists():
			raise CoverError('LIBREOFFICE_NOT_FOUND', 'LibreOffice (soffice) not found')
		if not pptx_path.exists():
			raise CoverError('PPTX_NOT_FOUND', f'PPTX not found: {pptx_path}')

		out_dir.mkdir(parents=True, exist_ok=True)
		cmd = [
			lo,
			'--headless',
			'--nologo',
			'--nofirststartwizard',
			'--convert-to',
			'png',
			'--outdir',
			str(out_dir),
			str(pptx_path),
		]
		try:
			subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		except subprocess.CalledProcessError as exc:
			raise CoverError('LIBREOFFICE_EXPORT_FAILED', exc.stderr.decode('utf-8', errors='ignore')) from exc

		pngs = sorted(out_dir.glob('*.png'))
		if not pngs:
			raise CoverError('LIBREOFFICE_EXPORT_FAILED', 'no png generated')
		return pngs[0]

	def generate(self, clean_out: CleanOutput) -> dict[str, Path]:
		"""
		Generate cover (640x360) and preview (1920x1080) images from cleaned PPTX.
		"""
		channel_dir = self._config.output_dir / clean_out.channel_id
		channel_dir.mkdir(parents=True, exist_ok=True)

		ext = self._config.format.lower()
		cover_path = channel_dir / f'{clean_out.aid}-cover.{ext}'
		preview_path = channel_dir / f'{clean_out.aid}-preview.{ext}'

		with tempfile.TemporaryDirectory() as tmp:
			tmp_dir = Path(tmp)
			png = self._export_first_slide(clean_out.clean_pptx_path, tmp_dir)
			self._generate_image(png, cover_path, (640, 360))
			self._generate_image(png, preview_path, (1920, 1080))

		return {
			'cover_path': cover_path,
			'preview_path': preview_path,
		}


def run_cover(
	conn,
	*,
	source_batch_id: str,
	clean_out: CleanOutput,
	workshop: WorkshopCover,
) -> dict[str, Path]:
	started_at = datetime.now(timezone.utc)
	try:
		result = workshop.generate(clean_out)
		# Persist as latest local cover (used by publish step).
		upsert_processed_asset(
			conn,
			aid=clean_out.aid,
			source_batch_id=source_batch_id,
			fields={
				'local_cover_path': result.get('cover_path'),
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings: list[str] = []
		artifacts = {
			'cover_path': str(result.get('cover_path')) if result.get('cover_path') else None,
			'preview_path': str(result.get('preview_path')) if result.get('preview_path') else None,
		}
	except CoverError as exc:
		status = StageStatus.failed
		error_code = exc.code
		error_message = exc.message
		warnings = []
		artifacts = {}
		raise
	except Exception as exc:  # noqa: BLE001
		status = StageStatus.failed
		error_code = 'COVER_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
		raise CoverError(error_code, error_message) from exc
	finally:
		finished_at = datetime.now(timezone.utc)
		record_stage(
			conn,
			StageRecord(
				aid=clean_out.aid,
				stage=StageName.COVER,
				status=status,
				started_at=started_at,
				finished_at=finished_at,
				error_code=error_code,
				error_message=error_message,
				warnings=warnings,
				artifacts=artifacts,
			),
		)

	return result

