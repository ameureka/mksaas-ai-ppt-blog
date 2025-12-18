from __future__ import annotations

from factory.gates.final_gate import FinalGateValidator, apply_final_gate
from factory.types import PpthubInitItem
from factory.workshops.workshopF import WorkshopF, WorkshopFConfig
import sqlite3
from pathlib import Path
from factory.db.init_db import init_db
from factory.db.dao import get_stage_status
from factory.stages import StageName, StageStatus


def test_property11_final_gate_blocked_and_report(tmp_path: Path) -> None:
	validator = FinalGateValidator(valid_categories={'general'})
	valid_item = PpthubInitItem(
		id='ppt_1',
		title='T1',
		category='general',
		tags=[],
		description='',
		language='中文',
		slides_count=1,
		file_url='https://cdn/p1.pptx',
		thumbnail_url='https://cdn/p1.jpg',
	)
	block_item = PpthubInitItem(
		id='ppt_2',
		title='',
		category='unknown',
		tags=[],
		description='',
		language='Fr',
		slides_count=1,
		file_url='',
		thumbnail_url='',
	)

	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		res = apply_final_gate(conn, source_batch_id='b1', items=[valid_item, block_item], validator=validator)
		assert len(res.valid) == 1
		assert len(res.blocked) == 1

		stage = get_stage_status(conn, aid='*', stage=StageName.final_gate)
		assert stage is not None
		assert stage.status == StageStatus.export_blocked

		wf = WorkshopF(WorkshopFConfig(output_dir=tmp_path))
		report = wf.write_report(batch_id='b1', valid=res.valid, blocked=res.blocked)
		import json

		data = json.loads(report.read_text(encoding='utf-8'))
		assert data['total'] == 2
		assert data['blocked'] == 1
		assert len(data['blocked_reasons']) == 1
	finally:
		conn.close()
