from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
import shutil
from pathlib import Path
from typing import Any
import zipfile
import re

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import EtlOutput, StageRecord, StandardInputPackage


_SLIDE_XML_RE = re.compile(r'^ppt/slides/slide\d+\.xml$')


def _count_slides(pptx_path: Path) -> int:
	"""
	Count slides in a PPTX without external dependencies.

	PPTX is a zip file; slide XMLs live under `ppt/slides/slideN.xml`.
	"""
	try:
		with zipfile.ZipFile(pptx_path) as zf:
			names = zf.namelist()
	except zipfile.BadZipFile as exc:
		raise ValueError(f'invalid pptx (not a zip): {pptx_path}') from exc

	count = sum(1 for name in names if _SLIDE_XML_RE.match(name))
	if count <= 0:
		raise ValueError(f'invalid pptx (no slides): {pptx_path}')
	return count


@dataclass(frozen=True)
class WorkshopAConfig:
	output_dir: Path


class WorkshopA:
	def __init__(self, config: WorkshopAConfig) -> None:
		self._config = config

	@staticmethod
	def _parse_origin_updated_at(meta: dict[str, Any]) -> datetime | None:
		raw = meta.get('origin_updated_at') or meta.get('updatedAt')
		if not isinstance(raw, str):
			return None
		value = raw.strip()
		if not value:
			return None
		for fmt in ('%Y-%m-%dT%H:%M:%S', '%Y-%m-%d'):
			try:
				return datetime.fromisoformat(value) if 'T' in value else datetime.strptime(value, fmt)
			except ValueError:
				continue
		return None

	def etl(self, pkg: StandardInputPackage) -> EtlOutput:
		"""
		Compute pages_count + file_size_kb and normalize naming for downstream.
		- Output filename: {aid}-{title or 'ppt'}.pptx under configured output_dir/{channel_id}/
		- file_size_kb: ceil(bytes/1024)
		- If input is not a valid pptx, raises ValueError with clear message.
		"""
		try:
			import json
			meta: dict[str, Any] = json.loads(pkg.meta_path.read_text(encoding='utf-8'))
		except Exception:
			meta = {}

		title_str = str(meta.get('title') or '').strip()
		safe_title = title_str if title_str else 'ppt'

		output_dir = self._config.output_dir / pkg.channel_id
		output_dir.mkdir(parents=True, exist_ok=True)
		output_path = output_dir / f'{pkg.aid}-{safe_title}.pptx'

		# Copy main.pptx to normalized name.
		shutil.copyfile(pkg.main_pptx_path, output_path)

		try:
			pages_count = _count_slides(output_path)
		except Exception as exc:  # noqa: BLE001
			raise ValueError(f'failed to open pptx: {pkg.main_pptx_path}') from exc

		file_size_bytes = output_path.stat().st_size
		file_size_kb = int(math.ceil(file_size_bytes / 1024))

		origin_updated_at = self._parse_origin_updated_at(meta)

		return EtlOutput(
			aid=pkg.aid,
			channel_id=pkg.channel_id,
			local_pptx_path=output_path,
			local_cover_path=pkg.cover_path,
			pages_count=pages_count,
			file_size_kb=file_size_kb,
			origin_updated_at=origin_updated_at,
			meta=meta,
		)


def run_etl(
	conn,
	*,
	source_batch_id: str,
	pkg: StandardInputPackage,
	workshop: WorkshopA,
) -> EtlOutput:
	"""
	Run workshop A and persist processed_assets + stage record.
	"""
	started_at = datetime.now(timezone.utc)
	try:
		out = workshop.etl(pkg)
		upsert_processed_asset(
			conn,
			aid=pkg.aid,
			source_batch_id=source_batch_id,
			fields={
				'local_pptx_path': out.local_pptx_path,
				'local_cover_path': out.local_cover_path,
				'pages_count': out.pages_count,
				'file_size_kb': out.file_size_kb,
				'file_format': out.file_format,
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings: list[str] = []
		artifacts: dict[str, Any] = {
			'local_pptx_path': str(out.local_pptx_path),
			'local_cover_path': str(out.local_cover_path) if out.local_cover_path else None,
			'pages_count': out.pages_count,
			'file_size_kb': out.file_size_kb,
			'origin_updated_at': out.origin_updated_at.isoformat() if out.origin_updated_at else None,
		}
	except Exception as exc:  # noqa: BLE001
		out = None
		status = StageStatus.failed
		error_code = 'ETL_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
	finally:
		finished_at = datetime.now(timezone.utc)

	record_stage(
		conn,
		StageRecord(
			aid=pkg.aid,
			stage=StageName.A,
			status=status,
			started_at=started_at,
			finished_at=finished_at,
			error_code=error_code,
			error_message=error_message,
			warnings=warnings,
			artifacts=artifacts,
		),
	)

	if status != StageStatus.success or out is None:
		raise ValueError(error_message or 'ETL failed')

	return out
