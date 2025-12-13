from __future__ import annotations

import json
from pathlib import Path
import sqlite3

from factory.db.init_db import init_db
from factory.db.dao import get_stage_status
from factory.stages import StageName, StageStatus
from factory.types import StandardInputPackage
from factory.workshops.workshopA import WorkshopA, WorkshopAConfig, run_etl


def test_workshopA_etl_computes_pages_and_size(tmp_path: Path) -> None:
	src_pptx = Path('AA-003ppt自动化脚本/pachong/downloads/ppt_moban/139646-灰色简约曲线背景的欧美风商务汇报PPT模板.zip')
	assert src_pptx.exists(), 'fixture pptx zip must exist'

	# Use the prepared StandardInputPackage from input_raw to avoid re-extraction.
	input_root = Path('AA-003ppt自动化脚本/piliang/input_raw/ppt_moban/139646')
	pkg = StandardInputPackage(
		aid='139646',
		channel_id='ppt_moban',
		root_dir=input_root,
		main_pptx_path=input_root / 'main.pptx',
		meta_path=input_root / 'meta.json',
		cover_path=input_root / 'cover.jpg',
	)

	output_dir = tmp_path / 'output_etl'
	wa = WorkshopA(WorkshopAConfig(output_dir=output_dir))
	out = wa.etl(pkg)

	assert out.local_pptx_path.exists()
	assert out.local_pptx_path.name.startswith('139646-')
	assert out.pages_count > 0
	assert out.file_size_kb > 0
	assert out.local_cover_path == pkg.cover_path
	assert out.meta.get('aid') == '139646'


def test_workshopA_updates_processed_assets(tmp_path: Path) -> None:
	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		pkg = StandardInputPackage(
			aid='a1',
			channel_id='chan',
			root_dir=tmp_path,
			main_pptx_path=tmp_path / 'main.pptx',
			meta_path=tmp_path / 'meta.json',
			cover_path=None,
		)
		# Minimal valid pptx: use a small fixture from input_raw to stay valid.
		fixture = Path('AA-003ppt自动化脚本/piliang/input_raw/ppt_moban/139646/main.pptx')
		assert fixture.exists()
		pkg.main_pptx_path.write_bytes(fixture.read_bytes())
		meta_payload = {'aid': 'a1', 'title': 'T', 'channel_id': 'chan', 'channel_name': 'C', 'original_tags': ['x']}
		pkg.meta_path.write_text(json.dumps(meta_payload, ensure_ascii=False), encoding='utf-8')

		wa = WorkshopA(WorkshopAConfig(output_dir=tmp_path / 'out'))
		out = run_etl(conn, source_batch_id='b1', pkg=pkg, workshop=wa)

		row = conn.execute("SELECT pages_count, file_size_kb, file_format FROM processed_assets WHERE aid='a1'").fetchone()
		assert row is not None
		assert row['pages_count'] == out.pages_count
		assert row['file_size_kb'] == out.file_size_kb
		assert row['file_format'] == 'pptx'

		stage = get_stage_status(conn, aid='a1', stage=StageName.A)
		assert stage is not None
		assert stage.status == StageStatus.success
	finally:
		conn.close()
