"""处理状态数据库"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from .models import ProcessStatus, Status


class ProcessDB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _get_conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_schema(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS process_log (
                    aid TEXT PRIMARY KEY,
                    channel TEXT NOT NULL,
                    status TEXT NOT NULL,
                    slide_count INTEGER,
                    preview_paths TEXT,
                    error_msg TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON process_log(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_channel ON process_log(channel)")

    def get_status(self, aid: str) -> Optional[ProcessStatus]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT aid, channel, status, slide_count, preview_paths, error_msg, created_at, updated_at FROM process_log WHERE aid = ?",
                (aid,)
            ).fetchone()
        if not row:
            return None
        return ProcessStatus(
            aid=row[0],
            channel=row[1],
            status=Status(row[2]),
            slide_count=row[3],
            preview_paths=json.loads(row[4]) if row[4] else None,
            error_msg=row[5],
            created_at=row[6],
            updated_at=row[7],
        )

    def _upsert(self, aid: str, channel: str, status: Status, slide_count: Optional[int] = None,
                preview_paths: Optional[List[str]] = None, error_msg: Optional[str] = None):
        now = datetime.now().isoformat()
        # 空列表也要序列化为 "[]"，而不是 None
        preview_json = json.dumps(preview_paths) if preview_paths is not None else None
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO process_log (aid, channel, status, slide_count, preview_paths, error_msg, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(aid) DO UPDATE SET
                    status = excluded.status,
                    slide_count = excluded.slide_count,
                    preview_paths = excluded.preview_paths,
                    error_msg = excluded.error_msg,
                    updated_at = excluded.updated_at
            """, (aid, channel, status.value, slide_count, preview_json, error_msg, now, now))

    def mark_completed(self, aid: str, channel: str, slide_count: int, preview_paths: List[str]):
        self._upsert(aid, channel, Status.COMPLETED, slide_count=slide_count, preview_paths=preview_paths)

    def mark_failed(self, aid: str, channel: str, error_msg: str):
        self._upsert(aid, channel, Status.FAILED, error_msg=error_msg)

    def mark_archived(self, aid: str, channel: str, slide_count: int):
        self._upsert(aid, channel, Status.ARCHIVED, slide_count=slide_count)

    def mark_processing(self, aid: str, channel: str):
        self._upsert(aid, channel, Status.PROCESSING)

    def get_pending_aids(self, channel: str) -> List[str]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT aid FROM process_log WHERE channel = ? AND status IN ('PENDING', 'PROCESSING')",
                (channel,)
            ).fetchall()
        return [r[0] for r in rows]

    def get_all_by_channel(self, channel: str) -> List[ProcessStatus]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT aid, channel, status, slide_count, preview_paths, error_msg, created_at, updated_at FROM process_log WHERE channel = ?",
                (channel,)
            ).fetchall()
        return [ProcessStatus(
            aid=r[0], channel=r[1], status=Status(r[2]), slide_count=r[3],
            preview_paths=json.loads(r[4]) if r[4] else None,
            error_msg=r[5], created_at=r[6], updated_at=r[7]
        ) for r in rows]

    def reset_failed_to_pending(self, channel: Optional[str] = None) -> int:
        with self._get_conn() as conn:
            if channel:
                result = conn.execute(
                    "UPDATE process_log SET status = 'PENDING', updated_at = ? WHERE status = 'FAILED' AND channel = ?",
                    (datetime.now().isoformat(), channel)
                )
            else:
                result = conn.execute(
                    "UPDATE process_log SET status = 'PENDING', updated_at = ? WHERE status = 'FAILED'",
                    (datetime.now().isoformat(),)
                )
            return result.rowcount

    def get_stats(self, channel: Optional[str] = None) -> dict:
        with self._get_conn() as conn:
            if channel:
                rows = conn.execute(
                    "SELECT status, COUNT(*) FROM process_log WHERE channel = ? GROUP BY status",
                    (channel,)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT status, COUNT(*) FROM process_log GROUP BY status"
                ).fetchall()
        return {r[0]: r[1] for r in rows}
