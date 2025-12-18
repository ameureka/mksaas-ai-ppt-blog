from __future__ import annotations

import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import CleanOutput, EtlOutput, StageRecord


@dataclass(frozen=True)
class WorkshopDConfig:
	output_dir: Path


class WorkshopD:
	def __init__(self, config: WorkshopDConfig) -> None:
		self._config = config

	def pack(self, etl_out: EtlOutput, clean_out: CleanOutput) -> dict:
		"""
		Organize local outputs into output/{channel_id}/ with pptx + cover + ai meta (if present).
		"""
		target_dir = self._config.output_dir / etl_out.channel_id
		target_dir.mkdir(parents=True, exist_ok=True)

		final_pptx = target_dir / f'{etl_out.aid}-final.pptx'
		shutil.copyfile(clean_out.clean_pptx_path, final_pptx)

		final_cover = None
		if etl_out.local_cover_path and etl_out.local_cover_path.exists():
			final_cover = target_dir / f'{etl_out.aid}-cover.jpg'
			shutil.copyfile(etl_out.local_cover_path, final_cover)

		return {
			'pptx_path': final_pptx,
			'cover_path': final_cover,
		}


def run_pack(
	conn,
	*,
	source_batch_id: str,
	etl_out: EtlOutput,
	clean_out: CleanOutput,
	workshop: WorkshopD,
) -> dict:
	started_at = datetime.now(timezone.utc)
	try:
		result = workshop.pack(etl_out, clean_out)
		local_cover = result['cover_path'] or etl_out.local_cover_path
		upsert_processed_asset(
			conn,
			aid=etl_out.aid,
			source_batch_id=source_batch_id,
			fields={
				'local_pptx_path': result['pptx_path'],
				'local_cover_path': local_cover,
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings = []
		artifacts = {
			'local_pptx_path': str(result['pptx_path']),
			'local_cover_path': str(result['cover_path']) if result['cover_path'] else None,
		}
	except Exception as exc:  # noqa: BLE001
		status = StageStatus.failed
		error_code = 'PACK_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
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

	if status != StageStatus.success:
		raise ValueError(error_message or 'pack failed')

	return result
