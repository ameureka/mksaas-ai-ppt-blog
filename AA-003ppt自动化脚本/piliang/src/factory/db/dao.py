from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from ..stages import StageName, StageStatus
from ..types import StageRecord

_JSON_SEPARATORS: tuple[str, str] = (',', ':')


def _dump_json(value: Any) -> str:
	return json.dumps(value, ensure_ascii=False, separators=_JSON_SEPARATORS)


def _dedupe_keep_order(items: list[str]) -> list[str]:
	seen: set[str] = set()
	out: list[str] = []
	for item in items:
		if item in seen:
			continue
		seen.add(item)
		out.append(item)
	return out


def _normalize_warnings(value: Any) -> list[str]:
	if value is None:
		return []
	if isinstance(value, str):
		return [value] if value.strip() else []
	if isinstance(value, list):
		normalized = [str(v).strip() for v in value]
		return _dedupe_keep_order([v for v in normalized if v])
	normalized = str(value).strip()
	return [normalized] if normalized else []


def _normalize_artifacts(value: Any) -> dict[str, Any]:
	if value is None:
		return {}
	if isinstance(value, dict):
		return value
	return {'_raw': value}


def _load_json(value: str | None, *, default: Any) -> Any:
	if value is None or value == '':
		return default
	try:
		return json.loads(value)
	except json.JSONDecodeError:
		return default


def _format_dt(value: datetime | None) -> str | None:
	if value is None:
		return None
	return value.isoformat(timespec='seconds')


def _parse_dt(value: str | None) -> datetime | None:
	if not value:
		return None
	try:
		return datetime.fromisoformat(value)
	except ValueError:
		try:
			return datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
		except ValueError:
			return None


def ensure_batch(
	conn: sqlite3.Connection,
	*,
	source_batch_id: str,
	input_root: str | None = None,
	notes: str | None = None,
) -> None:
	conn.execute(
		"""
		INSERT INTO batches (source_batch_id, input_root, notes, created_at, updated_at)
		VALUES (?, ?, ?, datetime('now'), datetime('now'))
		ON CONFLICT(source_batch_id) DO UPDATE SET
		  input_root = COALESCE(excluded.input_root, batches.input_root),
		  notes = COALESCE(excluded.notes, batches.notes),
		  updated_at = datetime('now')
		""",
		(source_batch_id, input_root, notes),
	)


def upsert_raw_asset(
	conn: sqlite3.Connection,
	*,
	aid: str,
	source_batch_id: str,
	channel_ids: list[str] | None = None,
	channel_names: list[str] | None = None,
	detail_url: str | None = None,
	original_tags: list[str] | None = None,
	origin_updated_at: datetime | None = None,
	file_path: Path | str | None = None,
	cover_path: Path | str | None = None,
	ingest_status: str | None = None,
	ingest_error_code: str | None = None,
	ingest_error_message: str | None = None,
) -> None:
	ensure_batch(conn, source_batch_id=source_batch_id)
	channel_ids_json = _dump_json(channel_ids or [])
	channel_names_json = _dump_json(channel_names or [])
	original_tags_json = _dump_json(original_tags or [])
	file_path_str = str(file_path) if file_path is not None else None
	cover_path_str = str(cover_path) if cover_path is not None else None
	origin_updated_at_str = _format_dt(origin_updated_at)

	conn.execute(
		"""
		INSERT INTO raw_assets (
		  aid, source_batch_id, channel_ids, channel_names, detail_url, original_tags,
		  origin_updated_at, file_path, cover_path, ingest_status, ingest_error_code, ingest_error_message,
		  created_at, updated_at
		)
		VALUES (
		  ?, ?, ?, ?, ?, ?,
		  ?, ?, ?, ?, ?, ?,
		  datetime('now'), datetime('now')
		)
		ON CONFLICT(aid) DO UPDATE SET
		  source_batch_id = excluded.source_batch_id,
		  channel_ids = excluded.channel_ids,
		  channel_names = excluded.channel_names,
		  detail_url = excluded.detail_url,
		  original_tags = excluded.original_tags,
		  origin_updated_at = excluded.origin_updated_at,
		  file_path = excluded.file_path,
		  cover_path = excluded.cover_path,
		  ingest_status = excluded.ingest_status,
		  ingest_error_code = excluded.ingest_error_code,
		  ingest_error_message = excluded.ingest_error_message,
		  updated_at = datetime('now')
		""",
		(
			aid,
			source_batch_id,
			channel_ids_json,
			channel_names_json,
			detail_url,
			original_tags_json,
			origin_updated_at_str,
			file_path_str,
			cover_path_str,
			ingest_status,
			ingest_error_code,
			ingest_error_message,
		),
	)


def upsert_processed_asset(
	conn: sqlite3.Connection,
	*,
	aid: str,
	source_batch_id: str,
	fields: dict[str, Any],
) -> None:
	ensure_batch(conn, source_batch_id=source_batch_id)
	normalized: dict[str, Any] = {}
	for key, raw_value in fields.items():
		if key in {'created_at', 'updated_at'}:
			continue
		if raw_value is None:
			normalized[key] = None
			continue
		if isinstance(raw_value, Path):
			normalized[key] = str(raw_value)
			continue
		if key in {'ai_keywords'} and not isinstance(raw_value, str):
			normalized[key] = _dump_json(raw_value)
			continue
		normalized[key] = raw_value

	columns = ['aid', 'source_batch_id', *normalized.keys()]
	placeholders = ', '.join(['?'] * len(columns))
	update_columns = ['source_batch_id', *normalized.keys()]
	update_assignments = ', '.join([f'{col}=excluded.{col}' for col in update_columns])
	sql = f"""
	INSERT INTO processed_assets ({', '.join(columns)})
	VALUES ({placeholders})
	ON CONFLICT(aid) DO UPDATE SET
	  {update_assignments},
	  updated_at = datetime('now')
	"""

	values = [aid, source_batch_id, *normalized.values()]
	conn.execute(sql, values)


def record_stage(conn: sqlite3.Connection, record: StageRecord) -> None:
	started_at = _format_dt(record.started_at)
	finished_at = _format_dt(record.finished_at)
	warnings_json = _dump_json(_normalize_warnings(record.warnings))
	artifacts_json = _dump_json(_normalize_artifacts(record.artifacts))

	conn.execute(
		"""
		INSERT INTO asset_stages (
		  aid, stage, status, started_at, finished_at,
		  error_code, error_message, warnings, artifacts
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(aid, stage) DO UPDATE SET
		  status = excluded.status,
		  started_at = COALESCE(asset_stages.started_at, excluded.started_at),
		  finished_at = excluded.finished_at,
		  error_code = excluded.error_code,
		  error_message = excluded.error_message,
		  warnings = excluded.warnings,
		  artifacts = excluded.artifacts
		""",
		(
			record.aid,
			record.stage.value,
			record.status.value,
			started_at,
			finished_at,
			record.error_code,
			record.error_message,
			warnings_json,
			artifacts_json,
		),
	)


def get_stage_status(
	conn: sqlite3.Connection,
	*,
	aid: str,
	stage: StageName,
) -> StageRecord | None:
	row = conn.execute(
		"SELECT aid, stage, status, started_at, finished_at, error_code, error_message, warnings, artifacts FROM asset_stages WHERE aid=? AND stage=? LIMIT 1",
		(aid, stage.value),
	).fetchone()
	if row is None:
		return None

	warnings = _load_json(row['warnings'], default=[])
	if not isinstance(warnings, list):
		warnings = []
	artifacts = _load_json(row['artifacts'], default={})
	if not isinstance(artifacts, dict):
		artifacts = {}

	return StageRecord(
		aid=row['aid'],
		stage=StageName(row['stage']),
		status=StageStatus(row['status']),
		started_at=_parse_dt(row['started_at']),
		finished_at=_parse_dt(row['finished_at']),
		error_code=row['error_code'],
		error_message=row['error_message'],
		warnings=[str(w) for w in warnings],
		artifacts=artifacts,
	)


def list_assets_for_batch(
	conn: sqlite3.Connection,
	*,
	source_batch_id: str,
) -> list[dict[str, Any]]:
	rows = conn.execute(
		"""
		SELECT
		  ra.aid as aid,
		  ra.ingest_status as ingest_status,
		  ra.detail_url as detail_url,
		  pa.publish_status as publish_status,
		  pa.export_status as export_status
		FROM raw_assets ra
		LEFT JOIN processed_assets pa ON pa.aid = ra.aid
		WHERE ra.source_batch_id = ?
		ORDER BY ra.aid
		""",
		(source_batch_id,),
	).fetchall()
	return [dict(r) for r in rows]
