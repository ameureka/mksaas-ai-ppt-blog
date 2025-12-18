from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest
from factory.db.init_db import init_db
from factory.db.dao import get_stage_status
from factory.stages import StageName, StageStatus
from factory.types import PackedOutput
from factory.storage.storage_adapter import StorageAdapter, StorageConfig
from factory.workshops.workshopE import WorkshopE, run_publish


def test_workshopE_publish_paths_and_urls(tmp_path: Path) -> None:
	packed = PackedOutput(
		aid='a1',
		channel_id='general',
		output_dir=tmp_path,
		pptx_path=tmp_path / 'pptx.pptx',
		cover_path=tmp_path / 'cover.jpg',
		preview_path=tmp_path / 'preview.jpg',
		ai_meta_path=None,
	)
	packed.pptx_path.write_bytes(b'123')
	packed.cover_path.write_bytes(b'456')
	packed.preview_path.write_bytes(b'789')

	config = StorageConfig(
		endpoint='',
		bucket='',
		access_key_id='',
		secret_access_key='',
		region='auto',
		public_base_url='https://cdn.example.com',
		dry_run=True,
	)
	storage = StorageAdapter(config)
	we = WorkshopE(storage)

	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		result = run_publish(conn, source_batch_id='b1', packed_out=packed, workshop=we, category='general')
		assert result['file_url_remote'] == 'https://cdn.example.com/ppts/general/ppt_a1.pptx'
		assert result['thumbnail_url_remote'] == 'https://cdn.example.com/thumbs/general/ppt_a1.jpg'
		assert result['preview_url_remote'] == 'https://cdn.example.com/previews/general/ppt_a1.jpg'

		stage = get_stage_status(conn, aid='a1', stage=StageName.E)
		assert stage is not None
		assert stage.status == StageStatus.success
	finally:
		conn.close()


def test_workshopE_publish_with_webp_cover_uses_webp_remote_path(tmp_path: Path) -> None:
	packed = PackedOutput(
		aid='a1w',
		channel_id='general',
		output_dir=tmp_path,
		pptx_path=tmp_path / 'pptx.pptx',
		cover_path=tmp_path / 'cover.webp',
		preview_path=tmp_path / 'preview.webp',
		ai_meta_path=None,
	)
	packed.pptx_path.write_bytes(b'123')
	packed.cover_path.write_bytes(b'RIFF....WEBP')
	packed.preview_path.write_bytes(b'RIFF....WEBP')

	config = StorageConfig(
		endpoint='',
		bucket='',
		access_key_id='',
		secret_access_key='',
		region='auto',
		public_base_url='https://cdn.example.com',
		dry_run=True,
	)
	storage = StorageAdapter(config)
	we = WorkshopE(storage)

	db_path = tmp_path / 'assets_webp.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		result = run_publish(conn, source_batch_id='b1', packed_out=packed, workshop=we, category='general')
		assert result['file_url_remote'] == 'https://cdn.example.com/ppts/general/ppt_a1w.pptx'
		assert result['thumbnail_url_remote'] == 'https://cdn.example.com/thumbs/general/ppt_a1w.webp'
		assert result['preview_url_remote'] == 'https://cdn.example.com/previews/general/ppt_a1w.webp'

		stage = get_stage_status(conn, aid='a1w', stage=StageName.E)
		assert stage is not None
		assert stage.status == StageStatus.success
	finally:
		conn.close()


def test_workshopE_publish_without_cover(tmp_path: Path) -> None:
	packed = PackedOutput(
		aid='a2',
		channel_id='general',
		output_dir=tmp_path,
		pptx_path=tmp_path / 'pptx.pptx',
		cover_path=None,
		preview_path=None,
		ai_meta_path=None,
	)
	packed.pptx_path.write_bytes(b'123')

	config = StorageConfig(
		endpoint='',
		bucket='',
		access_key_id='',
		secret_access_key='',
		region='auto',
		public_base_url='https://cdn.example.com',
		dry_run=True,
	)
	storage = StorageAdapter(config)
	we = WorkshopE(storage)

	db_path = tmp_path / 'assets.db'
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		result = run_publish(conn, source_batch_id='b1', packed_out=packed, workshop=we, category='general')
		assert result['file_url_remote'] == 'https://cdn.example.com/ppts/general/ppt_a2.pptx'
		assert result['thumbnail_url_remote'] is None
		assert result['preview_url_remote'] is None

		stage = get_stage_status(conn, aid='a2', stage=StageName.E)
		assert stage is not None
		assert stage.status == StageStatus.success
	finally:
		conn.close()
