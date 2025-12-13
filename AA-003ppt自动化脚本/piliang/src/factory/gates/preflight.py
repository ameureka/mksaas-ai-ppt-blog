from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..stages import StageName, StageStatus
from ..db.dao import record_stage
from ..types import StageRecord, StandardInputPackage


@dataclass(frozen=True)
class PreflightResult:
	status: StageStatus
	missing_keys: list[str]
	warnings: list[str]
	artifacts: dict[str, Any]
	error_code: str | None = None
	error_message: str | None = None


class PreflightValidator:
	_required_keys = ['aid', 'title', 'channel_id', 'channel_name', 'original_tags']

	def validate(self, pkg: StandardInputPackage) -> PreflightResult:
		"""
		Validate standard input package completeness before ETL.
		- meta.json 必须含必需键，否则 invalid_meta
		- main.pptx 缺失 → invalid_input
		- cover.jpg 缺失仅 warning
		"""
		missing_keys: list[str] = []
		warnings: list[str] = []
		artifacts: dict[str, Any] = {
			'meta_path': str(pkg.meta_path),
			'main_pptx_path': str(pkg.main_pptx_path),
			'cover_path': str(pkg.cover_path) if pkg.cover_path else None,
			'root_dir': str(pkg.root_dir),
		}

		if not pkg.main_pptx_path.exists():
			return PreflightResult(
				status=StageStatus.failed,
				missing_keys=missing_keys,
				warnings=warnings,
				artifacts=artifacts,
				error_code='INVALID_INPUT',
				error_message='main.pptx not found',
			)

		if pkg.cover_path is None or not pkg.cover_path.exists():
			warnings.append('WARN_COVER_MISSING')

		try:
			meta = json.loads(pkg.meta_path.read_text(encoding='utf-8'))
		except Exception as exc:  # noqa: BLE001
			return PreflightResult(
				status=StageStatus.failed,
				missing_keys=self._required_keys,
				warnings=warnings,
				artifacts=artifacts,
				error_code='INVALID_META',
				error_message=f'meta.json unreadable: {exc}',
			)

		if not isinstance(meta, dict):
			return PreflightResult(
				status=StageStatus.failed,
				missing_keys=self._required_keys,
				warnings=warnings,
				artifacts=artifacts,
				error_code='INVALID_META',
				error_message='meta.json is not an object',
			)

		for key in self._required_keys:
			if key not in meta:
				missing_keys.append(key)

		if missing_keys:
			return PreflightResult(
				status=StageStatus.failed,
				missing_keys=missing_keys,
				warnings=warnings,
				artifacts=artifacts,
				error_code='INVALID_META',
				error_message='missing required meta keys',
			)

		return PreflightResult(
			status=StageStatus.success,
			missing_keys=missing_keys,
			warnings=warnings,
			artifacts=artifacts,
		)


def _derive_ingest_status(result: PreflightResult) -> str:
	if result.error_code == 'INVALID_INPUT':
		return 'invalid_input'
	if result.error_code == 'INVALID_META':
		return 'invalid_meta'
	return 'success' if result.status == StageStatus.success else 'failed'


def run_preflight(
	conn,
	*,
	source_batch_id: str,
	pkg: StandardInputPackage,
	validator: PreflightValidator | None = None,
) -> PreflightResult:
	"""
	Run preflight validation and persist stage + ingest_status.
	Note: assumes raw_assets 已存在（由 W0 持久化）。
	"""
	validator = validator or PreflightValidator()
	started_at = datetime.now(timezone.utc)
	result = validator.validate(pkg)
	finished_at = datetime.now(timezone.utc)

	ingest_status = _derive_ingest_status(result)
	conn.execute(
		"""
		UPDATE raw_assets
		SET ingest_status = ?, ingest_error_code = ?, ingest_error_message = ?, updated_at = datetime('now')
		WHERE aid = ?
		""",
		(ingest_status, result.error_code, result.error_message, pkg.aid),
	)

	record_stage(
		conn,
		StageRecord(
			aid=pkg.aid,
			stage=StageName.preflight,
			status=result.status,
			started_at=started_at,
			finished_at=finished_at,
			error_code=result.error_code,
			error_message=result.error_message,
			warnings=result.warnings,
			artifacts=result.artifacts,
		),
	)

	return result


def to_stage_record(aid: str, result: PreflightResult) -> StageRecord:
	return StageRecord(
		aid=aid,
		stage=StageName.preflight,
		status=result.status,
		warnings=result.warnings,
		artifacts=result.artifacts,
		error_code=result.error_code,
		error_message=result.error_message,
	)
