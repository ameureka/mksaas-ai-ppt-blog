from __future__ import annotations

from datetime import datetime, timezone

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..storage.storage_adapter import StorageAdapter
from ..types import PackedOutput, StageRecord


class WorkshopE:
	def __init__(self, storage: StorageAdapter) -> None:
		self._storage = storage

	@staticmethod
	def _thumb_path_for_cover(base_thumb_path: str, cover_path) -> str:
		ext = (getattr(cover_path, 'suffix', '') or '').lower()
		if ext not in {'.webp', '.jpg', '.jpeg', '.png'}:
			ext = '.webp'
		if base_thumb_path.lower().endswith('.webp'):
			return base_thumb_path[:-5] + ext
		return base_thumb_path + ext

	def publish(self, packed_out: PackedOutput, *, category: str) -> dict[str, str | None]:
		paths = self._storage.compute_paths(category=category, aid=packed_out.aid)
		pptx_url = self._storage.upload(packed_out.pptx_path, paths['pptx'])
		thumb_url = None
		remote_thumb_path = None
		if packed_out.cover_path is not None:
			remote_thumb_path = self._thumb_path_for_cover(paths['thumb'], packed_out.cover_path)
			thumb_url = self._storage.upload(packed_out.cover_path, remote_thumb_path)
		return {
			'remote_pptx_path': paths['pptx'],
			'remote_thumb_path': remote_thumb_path,
			'file_url_remote': pptx_url,
			'thumbnail_url_remote': thumb_url,
			'cover_url_remote': thumb_url,
		}


def run_publish(
	conn,
	*,
	source_batch_id: str,
	packed_out: PackedOutput,
	workshop: WorkshopE,
	category: str,
	started_at=None,
) -> dict[str, str | None]:
	started_at = started_at or datetime.now(timezone.utc)
	try:
		result = workshop.publish(packed_out, category=category)
		upsert_processed_asset(
			conn,
			aid=packed_out.aid,
			source_batch_id=source_batch_id,
			fields={
				'file_url_remote': result['file_url_remote'],
				'thumbnail_url_remote': result['thumbnail_url_remote'],
				'cover_url_remote': result['cover_url_remote'],
				'publish_status': 'success',
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings = []
		artifacts = {
			'remote_pptx_path': result['remote_pptx_path'],
			'remote_thumb_path': result['remote_thumb_path'],
		}
	except Exception as exc:  # noqa: BLE001
		status = StageStatus.failed
		error_code = 'PUBLISH_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
	finally:
		finished_at = datetime.now(timezone.utc)

	record_stage(
		conn,
		StageRecord(
			aid=packed_out.aid,
			stage=StageName.E,
			status=status,
			started_at=started_at,
			finished_at=finished_at,
			error_code=error_code,
			error_message=error_message,
			warnings=warnings,
			artifacts=artifacts,
		),
	)

	if status != StageStatus.success:
		raise ValueError(error_message or 'publish failed')

	return result
