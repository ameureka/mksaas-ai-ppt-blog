from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from .init_db import init_db

DEFAULT_BUSY_TIMEOUT_MS = 5000


def get_conn(db_path: Path) -> sqlite3.Connection:
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	conn.execute('PRAGMA foreign_keys = ON;')
	conn.execute(f'PRAGMA busy_timeout = {DEFAULT_BUSY_TIMEOUT_MS};')
	return conn


@contextmanager
def with_transaction(conn: sqlite3.Connection) -> Iterator[sqlite3.Connection]:
	try:
		conn.execute('BEGIN;')
		yield conn
		conn.commit()
	except Exception:
		conn.rollback()
		raise

