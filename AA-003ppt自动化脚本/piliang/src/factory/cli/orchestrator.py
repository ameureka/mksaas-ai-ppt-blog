from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from typing import Callable

from ..db.dao import get_stage_status
from ..stages import StageName, StageStatus


@dataclass(frozen=True)
class OrchestratorConfig:
	batch_id: str
	from_stage: StageName
	to_stage: StageName
	aids: list[str] | None = None
	channels: list[str] | None = None
	dry_run: bool = False
	rerun_failed: bool = False


Handler = Callable[[sqlite3.Connection, str], None]


class Orchestrator:
	"""
	Minimal stage orchestrator.

	- Filters assets by batch/channel/aid.
	- Skips stages already marked `success`.
	- Optionally reruns `failed` stages when `rerun_failed=True`.
	"""

	_stage_order = [
		StageName.ingest,
		StageName.preflight,
		StageName.A,
		StageName.B,
		StageName.C,
		StageName.COVER,
		StageName.D,
		StageName.E,
		StageName.final_gate,
		StageName.F,
	]

	def __init__(self, *, conn: sqlite3.Connection, handlers: dict[StageName, Handler]) -> None:
		self._conn = conn
		self._handlers = handlers

	def _select_aids(self, cfg: OrchestratorConfig) -> list[str]:
		rows = self._conn.execute(
			'SELECT aid, channel_ids FROM raw_assets WHERE source_batch_id = ?',
			(cfg.batch_id,),
		).fetchall()
		by_aid: dict[str, list[str]] = {}
		for row in rows:
			channel_ids_raw = row['channel_ids'] if isinstance(row, sqlite3.Row) else row[1]
			try:
				channel_ids = json.loads(channel_ids_raw or '[]')
			except Exception:
				channel_ids = []
			by_aid[str(row['aid'] if isinstance(row, sqlite3.Row) else row[0])] = [
				str(x) for x in (channel_ids or [])
			]

		def channel_ok(aid: str) -> bool:
			if not cfg.channels:
				return True
			ids = by_aid.get(aid, [])
			return any(ch in ids for ch in cfg.channels)

		if cfg.aids:
			return [aid for aid in cfg.aids if aid in by_aid and channel_ok(aid)]

		# Stable default ordering.
		return sorted([aid for aid in by_aid.keys() if channel_ok(aid)])

	def run(self, cfg: OrchestratorConfig) -> list[str]:
		selected = self._select_aids(cfg)
		if not selected:
			return []

		start_idx = self._stage_order.index(cfg.from_stage)
		end_idx = self._stage_order.index(cfg.to_stage)
		if start_idx > end_idx:
			start_idx, end_idx = end_idx, start_idx

		stages = self._stage_order[start_idx : end_idx + 1]

		for stage in stages:
			handler = self._handlers.get(stage)
			if handler is None:
				continue
			for aid in selected:
				record = get_stage_status(self._conn, aid=aid, stage=stage)
				if record is not None:
					if record.status == StageStatus.success:
						continue
					if record.status == StageStatus.failed and not cfg.rerun_failed:
						continue
				if cfg.dry_run:
					continue
				handler(self._conn, aid)

		return selected

