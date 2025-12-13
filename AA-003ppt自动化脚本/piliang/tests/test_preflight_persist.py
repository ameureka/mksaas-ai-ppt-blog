from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from factory.db.init_db import init_db
from factory.db.dao import get_stage_status, upsert_raw_asset
from factory.gates.preflight import PreflightValidator, run_preflight
from factory.stages import StageName, StageStatus
from factory.types import StandardInputPackage


def _make_pkg(tmp_path: Path, *, aid: str, with_cover: bool, with_keys: bool, with_main: bool) -> StandardInputPackage:
	root = tmp_path / aid
	root.mkdir(parents=True, exist_ok=True)

	main = root / 'main.pptx'
	if with_main:
		main.write_bytes(b'123')

	cover_path = root / 'cover.jpg'
	if with_cover:
		cover_path.write_bytes(b'456')
	else:
		cover_path = None

	meta = {'aid': aid} if not with_keys else {'aid': aid, 'title': 'T', 'channel_id': 'c', 'channel_name': 'C', 'original_tags': ['x']}
	(root / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False), encoding='utf-8')

	return StandardInputPackage(
		aid=aid,
		channel_id='chan',
		root_dir=root,
		main_pptx_path=main,
		meta_path=root / 'meta.json',
		cover_path=cover_path,
	)


def test_preflight_persist_success_and_warning(tmp_path: Path) -> None:
	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		upsert_raw_asset(conn, aid='a1', source_batch_id='b1', channel_ids=['chan'], channel_names=['Chan'])

		pkg = _make_pkg(tmp_path, aid='a1', with_cover=False, with_keys=True, with_main=True)
		result = run_preflight(conn, source_batch_id='b1', pkg=pkg, validator=PreflightValidator())
		assert result.status == StageStatus.success
		assert result.warnings == ['WARN_COVER_MISSING']

		row = conn.execute("SELECT ingest_status, ingest_error_code FROM raw_assets WHERE aid='a1'").fetchone()
		assert row['ingest_status'] == 'success'
		assert row['ingest_error_code'] is None

		stage = get_stage_status(conn, aid='a1', stage=StageName.preflight)
		assert stage is not None
		assert stage.status == StageStatus.success
		assert stage.warnings == ['WARN_COVER_MISSING']
	finally:
		conn.close()


def test_preflight_persist_invalid_meta(tmp_path: Path) -> None:
	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		upsert_raw_asset(conn, aid='a2', source_batch_id='b1', channel_ids=['chan'], channel_names=['Chan'])

		pkg = _make_pkg(tmp_path, aid='a2', with_cover=True, with_keys=False, with_main=True)
		result = run_preflight(conn, source_batch_id='b1', pkg=pkg, validator=PreflightValidator())
		assert result.status == StageStatus.failed
		assert result.error_code == 'INVALID_META'

		row = conn.execute("SELECT ingest_status, ingest_error_code FROM raw_assets WHERE aid='a2'").fetchone()
		assert row['ingest_status'] == 'invalid_meta'
		assert row['ingest_error_code'] == 'INVALID_META'

		stage = get_stage_status(conn, aid='a2', stage=StageName.preflight)
		assert stage is not None
		assert stage.status == StageStatus.failed
		assert stage.error_code == 'INVALID_META'
	finally:
		conn.close()


def test_preflight_persist_invalid_input(tmp_path: Path) -> None:
	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		upsert_raw_asset(conn, aid='a3', source_batch_id='b1', channel_ids=['chan'], channel_names=['Chan'])

		pkg = _make_pkg(tmp_path, aid='a3', with_cover=True, with_keys=True, with_main=False)
		result = run_preflight(conn, source_batch_id='b1', pkg=pkg, validator=PreflightValidator())
		assert result.status == StageStatus.failed
		assert result.error_code == 'INVALID_INPUT'

		row = conn.execute("SELECT ingest_status, ingest_error_code FROM raw_assets WHERE aid='a3'").fetchone()
		assert row['ingest_status'] == 'invalid_input'
		assert row['ingest_error_code'] == 'INVALID_INPUT'

		stage = get_stage_status(conn, aid='a3', stage=StageName.preflight)
		assert stage is not None
		assert stage.status == StageStatus.failed
		assert stage.error_code == 'INVALID_INPUT'
	finally:
		conn.close()

