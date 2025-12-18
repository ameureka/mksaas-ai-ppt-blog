from __future__ import annotations

import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import CleanOutput, CoverOutput, EtlOutput, PackedOutput, StageRecord


@dataclass(frozen=True)
class WorkshopDConfig:
	output_dir: Path


class WorkshopD:
	def __init__(self, config: WorkshopDConfig) -> None:
		self._config = config

	def pack(
		self,
		etl_out: EtlOutput,
		clean_out: CleanOutput,
		cover_out: CoverOutput | None = None,
	) -> PackedOutput:
		"""
		Organize local outputs into output/{channel_id}/ with pptx + cover + preview.
		"""
		target_dir = self._config.output_dir / etl_out.channel_id
		target_dir.mkdir(parents=True, exist_ok=True)

		final_pptx = target_dir / f'{etl_out.aid}-final.pptx'
		shutil.copyfile(clean_out.clean_pptx_path, final_pptx)

		# Use cover from Workshop Cover if available, otherwise fallback to original
		final_cover = None
		final_preview = None
		if cover_out and cover_out.cover_path.exists():
			ext = cover_out.cover_path.suffix
			final_cover = target_dir / f'{etl_out.aid}-cover{ext}'
			shutil.copyfile(cover_out.cover_path, final_cover)
			if cover_out.preview_path and cover_out.preview_path.exists():
				final_preview = target_dir / f'{etl_out.aid}-preview{ext}'
				shutil.copyfile(cover_out.preview_path, final_preview)
		elif etl_out.local_cover_path and etl_out.local_cover_path.exists():
			final_cover = target_dir / f'{etl_out.aid}-cover.jpg'
			shutil.copyfile(etl_out.local_cover_path, final_cover)

		return PackedOutput(
			aid=etl_out.aid,
			channel_id=etl_out.channel_id,
			output_dir=target_dir,
			pptx_path=final_pptx,
			cover_path=final_cover,
			preview_path=final_preview,
			ai_meta_path=None,
		)


def run_pack(
	conn,
	*,
	source_batch_id: str,
	etl_out: EtlOutput,
	clean_out: CleanOutput,
	workshop: WorkshopD,
	cover_out: CoverOutput | None = None,
) -> PackedOutput:
	started_at = datetime.now(timezone.utc)
	try:
		result = workshop.pack(etl_out, clean_out, cover_out)
		upsert_processed_asset(
			conn,
			aid=etl_out.aid,
			source_batch_id=source_batch_id,
			fields={
				'local_pptx_path': result.pptx_path,
				'local_cover_path': result.cover_path,
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings = []
		artifacts = {
			'local_pptx_path': str(result.pptx_path),
			'local_cover_path': str(result.cover_path) if result.cover_path else None,
			'local_preview_path': str(result.preview_path) if result.preview_path else None,
		}
	except Exception as exc:  # noqa: BLE001
		status = StageStatus.failed
		error_code = 'PACK_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
		raise
	finally:
		finished_at = datetime.now(timezone.utc)
		record_stage(
			conn,
			StageRecord(
				aid=etl_out.aid,
				stage=StageName.D,
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
