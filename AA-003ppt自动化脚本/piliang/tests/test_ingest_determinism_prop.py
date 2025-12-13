from __future__ import annotations

import json
import random
import sqlite3
import zipfile
from pathlib import Path

import pytest

from factory.db.init_db import init_db
from factory.utils.pptx_selector import select_main_pptx
from factory.workshops.workshop0 import Workshop0, Workshop0Paths


def _write_bytes(path: Path, size: int) -> None:
	path.parent.mkdir(parents=True, exist_ok=True)
	path.write_bytes(b'a' * size)


def _make_zip(zip_path: Path, files: dict[str, bytes]) -> None:
	zip_path.parent.mkdir(parents=True, exist_ok=True)
	with zipfile.ZipFile(zip_path, 'w') as zf:
		for name, payload in files.items():
			zf.writestr(name, payload)


def _make_crawler_db(db_path: Path, rows: list[dict]) -> None:
	conn = sqlite3.connect(db_path)
	try:
		conn.execute(
			"""
			CREATE TABLE tasks (
			  id INTEGER PRIMARY KEY,
			  url TEXT,
			  status TEXT,
			  meta TEXT
			)
			"""
		)
		for row in rows:
			conn.execute(
				"INSERT INTO tasks (id, url, status, meta) VALUES (?, ?, ?, ?)",
				(row['id'], row['url'], row['status'], json.dumps(row['meta'], ensure_ascii=False)),
			)
		conn.commit()
	finally:
		conn.close()


def _simplify_candidates(candidates: list) -> list[tuple[str, str, str | None, str | None, str | None]]:
	return [
		(
			c.aid,
			c.channel_id,
			c.detail_url,
			str(c.file_path) if c.file_path is not None else None,
			str(c.cover_path) if c.cover_path is not None else None,
		)
		for c in candidates
	]


def test_property1_ingest_determinism(tmp_path: Path) -> None:
	downloads_root = tmp_path / 'downloads'
	channel_id = 'chan1'
	channel_dir = downloads_root / channel_id
	channel_dir.mkdir(parents=True, exist_ok=True)
	images_dir = channel_dir / 'images'
	images_dir.mkdir(parents=True, exist_ok=True)

	# Asset 100: extracted directory with multiple pptx (aid match should win).
	extracted_dir = channel_dir / '100-foo'
	extracted_dir.mkdir(parents=True, exist_ok=True)
	_write_bytes(extracted_dir / '100-match.pptx', 9)
	_write_bytes(extracted_dir / 'other.pptx', 20)
	_write_bytes(images_dir / '100-cover.jpg', 3)

	# Asset 200: zip with multiple pptx (largest should win).
	zip_200 = channel_dir / '200-foo.zip'
	_make_zip(zip_200, {'foo.pptx': b'a' * 5, 'bar.pptx': b'a' * 11})
	_write_bytes(images_dir / '200-cover.jpg', 3)

	# Asset 300: zip without pptx -> invalid_input.
	zip_300 = channel_dir / '300-foo.zip'
	_make_zip(zip_300, {'readme.txt': b'hello'})

	crawler_db_path = tmp_path / 'crawler.db'
	_make_crawler_db(
		crawler_db_path,
		[
			{
				'id': 1,
				'url': 'https://example.com/100',
				'status': 'COMPLETED',
				'meta': {
					'aid': '100',
					'title': 'Foo Title',
					'channelId': channel_id,
					'channelName': 'Channel 1',
					'tags': ['t1', 't2'],
					'updatedAt': '2025-12-11',
					'detailUrl': 'https://example.com/100/detail',
				},
			},
			{
				'id': 2,
				'url': 'https://example.com/200',
				'status': 'COMPLETED',
				'meta': {
					'aid': '200',
					'title': 'Bar Title',
					'channelId': channel_id,
					'channelName': 'Channel 1',
					'tags': ['t3'],
					'updatedAt': '2025-12-10',
					'detailUrl': 'https://example.com/200/detail',
				},
			},
			{
				'id': 3,
				'url': 'https://example.com/300',
				'status': 'COMPLETED',
				'meta': {
					'aid': '300',
					'title': 'No PPTX',
					'channelId': channel_id,
					'channelName': 'Channel 1',
					'tags': [],
					'updatedAt': '2025-12-09',
					'detailUrl': 'https://example.com/300/detail',
				},
			},
		],
	)

	w0 = Workshop0(Workshop0Paths(downloads_root=downloads_root, crawler_db_path=crawler_db_path))

	# Deterministic discovery: same DB + filesystem => same candidates (order included).
	run1 = w0.discover_assets()
	run2 = w0.discover_assets()
	assert _simplify_candidates(run1) == _simplify_candidates(run2)

	# Deterministic selection: permutation of input list should not change selection result.
	paths = [extracted_dir / '100-match.pptx', extracted_dir / 'other.pptx']
	selected = select_main_pptx(paths, aid='100', title='Foo Title')
	assert selected is not None
	for seed in range(20):
		rng = random.Random(seed)
		shuffled = list(paths)
		rng.shuffle(shuffled)
		again = select_main_pptx(shuffled, aid='100', title='Foo Title')
		assert again is not None
		assert again.selected.name == selected.selected.name

	merged = w0.merge_duplicates(run1)

	assets_db_path = tmp_path / 'assets.db'
	init_db(assets_db_path)
	conn = sqlite3.connect(assets_db_path)
	conn.row_factory = sqlite3.Row
	try:
		w0.persist_raw_assets(conn, source_batch_id='b1', assets=merged)

		output_root = tmp_path / 'input_raw'
		pkgs = w0.build_standard_input_packages(
			conn,
			source_batch_id='b1',
			assets=merged,
			output_root=output_root,
		)

		# 100/200 should produce packages; 300 should be invalid_input.
		assert {p.aid for p in pkgs} == {'100', '200'}
		for pkg in pkgs:
			assert pkg.main_pptx_path.exists()
			assert pkg.meta_path.exists()
			meta = json.loads(pkg.meta_path.read_text(encoding='utf-8'))
			for key in ['aid', 'title', 'channel_id', 'channel_name', 'original_tags']:
				assert key in meta

			files = sorted([p.name for p in pkg.root_dir.iterdir() if p.is_file()])
			assert 'main.pptx' in files
			assert 'meta.json' in files

		# 100 chooses the aid-matching pptx (size 9), even though another is larger.
		main_100 = output_root / channel_id / '100' / 'main.pptx'
		assert main_100.exists()
		assert main_100.stat().st_size == 9

		# 200 chooses the largest pptx in zip (size 11).
		main_200 = output_root / channel_id / '200' / 'main.pptx'
		assert main_200.exists()
		assert main_200.stat().st_size == 11

		row = conn.execute("SELECT ingest_status FROM raw_assets WHERE aid='300' LIMIT 1").fetchone()
		assert row is not None
		assert row['ingest_status'] == 'invalid_input'
	finally:
		conn.close()


@pytest.mark.parametrize(
	'pptx_names',
	[
		(['a.pptx', 'b.pptx', 'c.pptx']),
		(['100.pptx', 'x.pptx']),
	],
)
def test_select_main_pptx_is_deterministic(tmp_path: Path, pptx_names: list[str]) -> None:
	paths = []
	for i, name in enumerate(pptx_names):
		p = tmp_path / name
		_write_bytes(p, 10 + i)
		paths.append(p)

	expected = select_main_pptx(paths, aid='100', title='Title')
	assert expected is not None

	for seed in range(30):
		rng = random.Random(seed)
		shuffled = list(paths)
		rng.shuffle(shuffled)
		got = select_main_pptx(shuffled, aid='100', title='Title')
		assert got is not None
		assert got.selected.name == expected.selected.name

