from __future__ import annotations

import csv
import json
from pathlib import Path

from factory.types import PpthubInitItem
from factory.workshops.workshopF import WorkshopF, WorkshopFConfig


def test_property10_export_json_csv_equivalence(tmp_path: Path) -> None:
	items = [
		PpthubInitItem(
			id='ppt_1',
			title='T1',
			category='general',
			tags=['a', 'b'],
			description='desc1',
			language='中文',
			slides_count=1,
			file_url='https://cdn/p1.pptx',
			thumbnail_url='https://cdn/p1.jpg',
		),
		PpthubInitItem(
			id='ppt_2',
			title='T2',
			category='design',
			tags=[],
			description='desc2',
			language='English',
			slides_count=2,
			file_url='https://cdn/p2.pptx',
			thumbnail_url='https://cdn/p2.jpg',
		),
	]
	wf = WorkshopF(WorkshopFConfig(output_dir=tmp_path))
	json_path = wf.export_json(batch_id='b1', items=items)
	csv_path = wf.export_csv(batch_id='b1', items=items)

	json_data = json.loads(json_path.read_text(encoding='utf-8'))
	items_from_json = json_data['items']

	with csv_path.open(encoding='utf-8') as f:
		reader = csv.DictReader(f)
		items_from_csv = list(reader)

	assert len(items_from_csv) == len(items_from_json) == 2

	def simplify(rows):
		return [
			(row['id'], row['title'], row['category'], row['file_url'], row['thumbnail_url'])
			for row in rows
		]

	assert simplify(items_from_csv) == simplify(items_from_json)
