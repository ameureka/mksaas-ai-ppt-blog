from __future__ import annotations

import sqlite3
from pathlib import Path


SCHEMA_PATH = Path(__file__).with_name('schema.sql')


def init_db(db_path: Path) -> None:
	db_path.parent.mkdir(parents=True, exist_ok=True)
	with sqlite3.connect(db_path) as conn:
		conn.execute('PRAGMA foreign_keys = ON;')
		conn.executescript(SCHEMA_PATH.read_text(encoding='utf-8'))

