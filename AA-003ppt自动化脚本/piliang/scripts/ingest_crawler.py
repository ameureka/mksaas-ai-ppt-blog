#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

def _bootstrap_import_path() -> Path:
	"""
	Prefer editable install (`pip install -e .`) so `factory` is importable.
	Fallback to local `src/` for direct execution.
	"""
	project_root = Path(__file__).resolve().parents[1]
	try:
		import factory  # noqa: F401
	except ImportError:
		sys.path.insert(0, str(project_root / 'src'))
	return project_root


PROJECT_ROOT = _bootstrap_import_path()

from factory.db.init_db import init_db  # noqa: E402
from factory.workshops.workshop0 import Workshop0, Workshop0Paths  # noqa: E402


def _resolve_path(project_root: Path, raw: str) -> Path:
	p = Path(raw)
	return p if p.is_absolute() else (project_root / p)


def main() -> None:
	parser = argparse.ArgumentParser(
		description='Build standard input packages from pachong crawler.db + downloads (Workshop0)',
	)
	parser.add_argument('--manifest', help='Optional manifest json to derive batch_id and aids')
	parser.add_argument('--batch-id', help='Batch id for assets.db (defaults to manifest.batch_id or timestamp)')
	parser.add_argument(
		'--crawler-db',
		default='../pachong/data/crawler.db',
		help='Path to crawler.db (default: ../pachong/data/crawler.db)',
	)
	parser.add_argument(
		'--downloads-root',
		default='data/downloads',
		help='Downloads root (default: data/downloads)',
	)
	parser.add_argument(
		'--output-root',
		default='data/input_raw',
		help='Output root for standard input packages (default: data/input_raw)',
	)
	parser.add_argument(
		'--assets-db',
		default='data/assets.db',
		help='SQLite db to persist ingest status (default: data/assets.db)',
	)
	parser.add_argument(
		'--aids',
		nargs='*',
		help='Only ingest these aids (space-separated). If --manifest is provided, aids are derived from it.',
	)
	parser.add_argument('--overwrite', action='store_true', help='Overwrite existing main.pptx/cover/meta.json')
	args = parser.parse_args()

	project_root = PROJECT_ROOT

	manifest_path = Path(args.manifest) if args.manifest else None
	manifest = None
	manifest_aids: set[str] | None = None
	if manifest_path is not None:
		manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
		manifest_aids = {str(item['aid']) for item in manifest.get('aids', []) if 'aid' in item}

	batch_id = args.batch_id or (manifest.get('batch_id') if isinstance(manifest, dict) else None)
	if not batch_id:
		batch_id = f"ingest-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

	crawler_db_path = _resolve_path(project_root, args.crawler_db)
	downloads_root = _resolve_path(project_root, args.downloads_root)
	output_root = _resolve_path(project_root, args.output_root)
	assets_db_path = _resolve_path(project_root, args.assets_db)

	aids = manifest_aids if manifest_aids is not None else ({str(x) for x in (args.aids or [])} or None)

	init_db(assets_db_path)
	conn = sqlite3.connect(assets_db_path)
	conn.row_factory = sqlite3.Row
	try:
		w0 = Workshop0(Workshop0Paths(downloads_root=downloads_root, crawler_db_path=crawler_db_path))
		candidates = w0.discover_assets(aids=aids)

		merged = w0.merge_duplicates(candidates)
		w0.persist_raw_assets(conn, source_batch_id=batch_id, assets=merged)
		pkgs = w0.build_standard_input_packages(
			conn,
			source_batch_id=batch_id,
			assets=merged,
			output_root=output_root,
			overwrite=args.overwrite,
		)
		conn.commit()
	finally:
		conn.close()

	print(
		f'Ingest finished. batch_id={batch_id} output_root={output_root} packages={len(pkgs)} assets_db={assets_db_path}',
	)


if __name__ == '__main__':
	main()
