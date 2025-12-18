from __future__ import annotations

import sqlite3
from factory.gates.final_gate import FinalGateValidator, apply_final_gate
from factory.types import PpthubInitItem
from factory.db.init_db import init_db
from factory.db.dao import get_stage_status


def test_final_gate_blocks_invalid_category_and_url():
	validator = FinalGateValidator(valid_categories={'general', 'design'})
	item_ok = PpthubInitItem(
		id='ppt_1',
		title='T',
		category='general',
		tags=[],
		description='',
		language='中文',
		slides_count=1,
		file_url='https://cdn/ppts/general/ppt_1.pptx',
		thumbnail_url='https://cdn/thumbs/general/ppt_1.jpg',
	)
	item_bad = PpthubInitItem(
		id='ppt_2',
		title='T',
		category='unknown',
		tags=[],
		description='',
		language='Fr',
		slides_count=1,
		file_url='',
		thumbnail_url='',
	)
	res = validator.validate_items([item_ok, item_bad])
	assert len(res.valid) == 1
	assert len(res.blocked) == 1
	assert res.blocked[0][1] in {'missing_url', 'invalid_category', 'invalid_language'}


def test_apply_final_gate_updates_export_status(tmp_path):
	validator = FinalGateValidator(valid_categories={'general'})
	items = [
		PpthubInitItem(
			id='ppt_a',
			title='T',
			category='general',
			tags=[],
			description='',
			language='中文',
			slides_count=1,
			file_url='https://cdn/ppts/general/ppt_a.pptx',
			thumbnail_url='https://cdn/thumbs/general/ppt_a.jpg',
		),
		PpthubInitItem(
			id='ppt_b',
			title='',
			category='unknown',
			tags=[],
			description='',
			language='Fr',
			slides_count=1,
			file_url='',
			thumbnail_url='',
		),
	]
	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		res = apply_final_gate(conn, source_batch_id='b1', items=items, validator=validator)
		assert len(res.valid) == 1
		assert len(res.blocked) == 1
		# final_gate stage uses aid='*' and stage=final_gate
		from factory.stages import StageName, StageStatus
		stage = get_stage_status(conn, aid='*', stage=StageName.final_gate)
		assert stage is not None
		assert stage.status == StageStatus.export_blocked
	finally:
		conn.close()
