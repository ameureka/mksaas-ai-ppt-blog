from __future__ import annotations

import sqlite3
from pathlib import Path

from factory.cli.orchestrator import Orchestrator, OrchestratorConfig
from factory.db.init_db import init_db
from factory.db.dao import record_stage
from factory.stages import StageName, StageStatus
from factory.types import StageRecord


def test_orchestrator_filters_and_skips_success(tmp_path: Path) -> None:
	db = tmp_path / 'assets.db'
	init_db(db)
	conn = sqlite3.connect(db)
	conn.row_factory = sqlite3.Row

	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a1','b1','[]','[]',datetime('now'),datetime('now'))"
	)
	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a2','b1','[]','[]',datetime('now'),datetime('now'))"
	)
	record_stage(
		conn,
		StageRecord(
			aid='a1',
			stage=StageName.ingest,
			status=StageStatus.success,
		),
	)

	called = []

	def handler(conn, aid):  # noqa: ANN001
		called.append(aid)

	orch = Orchestrator(conn=conn, handlers={StageName.ingest: handler})
	selected = orch.run(
		OrchestratorConfig(batch_id='b1', from_stage=StageName.ingest, to_stage=StageName.ingest, aids=['a1', 'a2'])
	)
	assert set(selected) == {'a1', 'a2'}
	# a1 skipped because success, a2 executed
	assert called == ['a2']


def test_orchestrator_dry_run(tmp_path: Path) -> None:
	db = tmp_path / 'assets.db'
	init_db(db)
	conn = sqlite3.connect(db)
	conn.row_factory = sqlite3.Row
	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a1','b1','[]','[]',datetime('now'),datetime('now'))"
	)

	called = []

	def handler(conn, aid):  # noqa: ANN001
		called.append(aid)

	orch = Orchestrator(conn=conn, handlers={StageName.ingest: handler})
	orch.run(
		OrchestratorConfig(
			batch_id='b1',
			from_stage=StageName.ingest,
			to_stage=StageName.ingest,
			dry_run=True,
		)
	)
	assert called == []


def test_orchestrator_rerun_failed(tmp_path: Path) -> None:
	db = tmp_path / 'assets.db'
	init_db(db)
	conn = sqlite3.connect(db)
	conn.row_factory = sqlite3.Row
	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a1','b1','[]','[]',datetime('now'),datetime('now'))"
	)
	record_stage(
		conn,
		StageRecord(
			aid='a1',
			stage=StageName.ingest,
			status=StageStatus.failed,
		),
	)

	called = []

	def handler(conn, aid):  # noqa: ANN001
		called.append(aid)
		record_stage(
			conn,
			StageRecord(
				aid=aid,
				stage=StageName.ingest,
				status=StageStatus.success,
			),
		)

	orch = Orchestrator(conn=conn, handlers={StageName.ingest: handler})
	orch.run(
		OrchestratorConfig(
			batch_id='b1',
			from_stage=StageName.ingest,
			to_stage=StageName.ingest,
			rerun_failed=True,
		)
	)
	assert called == ['a1']


def test_orchestrator_filters_by_channel_and_aid(tmp_path: Path) -> None:
	db = tmp_path / 'assets.db'
	init_db(db)
	conn = sqlite3.connect(db)
	conn.row_factory = sqlite3.Row
	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a1','b1','[\"c1\"]','[]',datetime('now'),datetime('now'))"
	)
	conn.execute(
		"INSERT INTO raw_assets (aid, source_batch_id, channel_ids, channel_names, created_at, updated_at) VALUES ('a2','b1','[\"c2\"]','[]',datetime('now'),datetime('now'))"
	)

	called = []

	def handler(conn, aid):  # noqa: ANN001
		called.append(aid)

	orch = Orchestrator(conn=conn, handlers={StageName.ingest: handler})
	selected = orch.run(
		OrchestratorConfig(
			batch_id='b1',
			from_stage=StageName.ingest,
			to_stage=StageName.ingest,
			channels=['c1'],
			aids=['a1', 'a2'],
		)
	)
	assert selected == ['a1']
	assert called == ['a1']
