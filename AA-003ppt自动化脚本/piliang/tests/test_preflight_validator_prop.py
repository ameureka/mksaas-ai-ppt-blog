from __future__ import annotations

import json
from pathlib import Path

from factory.gates.preflight import PreflightValidator
from factory.stages import StageStatus
from factory.types import StandardInputPackage


def _write_pkg(
	tmp_path: Path,
	*,
	aid: str,
	with_cover: bool,
	meta_payload: dict,
) -> StandardInputPackage:
	root = tmp_path / aid
	root.mkdir(parents=True, exist_ok=True)
	(root / 'main.pptx').write_bytes(b'123')
	if with_cover:
		cover = root / 'cover.jpg'
		cover.write_bytes(b'456')
	else:
		cover = None
	meta_path = root / 'meta.json'
	meta_path.write_text(json.dumps(meta_payload, ensure_ascii=False), encoding='utf-8')
	return StandardInputPackage(
		aid=aid,
		channel_id='chan',
		root_dir=root,
		main_pptx_path=root / 'main.pptx',
		meta_path=meta_path,
		cover_path=cover,
	)


def test_preflight_success_all_keys() -> None:
	validator = PreflightValidator()
	meta = {
		'aid': '1',
		'title': 'T',
		'channel_id': 'c',
		'channel_name': 'C',
		'original_tags': ['x'],
	}
	pkg = _write_pkg(Path('/tmp'), aid='1', with_cover=True, meta_payload=meta)
	res = validator.validate(pkg)
	assert res.status == StageStatus.success
	assert res.missing_keys == []
	assert res.warnings == []


def test_preflight_warn_when_cover_missing(tmp_path: Path) -> None:
	validator = PreflightValidator()
	meta = {
		'aid': '2',
		'title': 'T',
		'channel_id': 'c',
		'channel_name': 'C',
		'original_tags': ['x'],
	}
	pkg = _write_pkg(tmp_path, aid='2', with_cover=False, meta_payload=meta)
	res = validator.validate(pkg)
	assert res.status == StageStatus.success
	assert res.missing_keys == []
	assert res.warnings == ['WARN_COVER_MISSING']


def test_preflight_missing_keys_is_invalid_meta(tmp_path: Path) -> None:
	validator = PreflightValidator()
	meta = {'aid': '3'}
	pkg = _write_pkg(tmp_path, aid='3', with_cover=True, meta_payload=meta)
	res = validator.validate(pkg)
	assert res.status == StageStatus.failed
	assert res.error_code == 'INVALID_META'
	assert set(res.missing_keys) == {'title', 'channel_id', 'channel_name', 'original_tags'}
	assert res.warnings == []
