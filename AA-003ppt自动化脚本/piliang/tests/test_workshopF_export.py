from __future__ import annotations

import json
from pathlib import Path

from factory.types import PpthubInitItem
from factory.workshops.workshopF import WorkshopF, WorkshopFConfig


def test_workshopF_export_json_and_csv(tmp_path: Path) -> None:
	items = [
		PpthubInitItem(
			id='ppt_1',
			title='T1',
			category='general',
			tags=['a', 'b'],
			description='desc',
			language='中文',
			slides_count=1,
			file_url='https://cdn/ppt_1.pptx',
			thumbnail_url='https://cdn/ppt_1.jpg',
		)
	]
	wf = WorkshopF(WorkshopFConfig(output_dir=tmp_path))
	json_path = wf.export_json(batch_id='b1', items=items)
	assert json_path.exists()
	data = json.loads(json_path.read_text(encoding='utf-8'))
	assert data['meta']['schema_version'] == 'ppt-import-v2'
	assert len(data['items']) == 1
	assert data['items'][0]['id'] == 'ppt_1'

	csv_path = wf.export_csv(batch_id='b1', items=items)
	assert csv_path.exists()


def test_workshopF_report(tmp_path: Path) -> None:
	items = [
		PpthubInitItem(
			id='ppt_1',
			title='T1',
			category='general',
			tags=[],
			description='',
			language='中文',
			slides_count=1,
			file_url='https://cdn/ppt_1.pptx',
			thumbnail_url='https://cdn/ppt_1.jpg',
		)
	]
	blocked: list[tuple[PpthubInitItem, str]] = [(items[0], 'invalid')]
	wf = WorkshopF(WorkshopFConfig(output_dir=tmp_path))
	report_path = wf.write_report(batch_id='b1', valid=[], blocked=blocked)
	data = json.loads(report_path.read_text(encoding='utf-8'))
	assert data['total'] == 1
	assert data['blocked'] == 1
	assert data['blocked_reasons'][0]['reason'] == 'invalid'
