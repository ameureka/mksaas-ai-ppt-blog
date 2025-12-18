from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from ..types import PpthubInitItem
from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import StageRecord


@dataclass(frozen=True)
class FinalGateResult:
	valid: list[PpthubInitItem]
	blocked: list[tuple[PpthubInitItem, str]]
	warnings: list[str]


class FinalGateValidator:
	def __init__(self, *, valid_categories: set[str], valid_languages: set[str] | None = None) -> None:
		self._valid_categories = valid_categories
		self._valid_languages = valid_languages or {'中文', 'English', '其他'}

	def validate_items(self, items: list[PpthubInitItem]) -> FinalGateResult:
		valid: list[PpthubInitItem] = []
		blocked: list[tuple[PpthubInitItem, str]] = []
		for item in items:
			reason = self._validate_item(item)
			if reason is None:
				valid.append(item)
			else:
				blocked.append((item, reason))
		return FinalGateResult(valid=valid, blocked=blocked, warnings=[])

	def _validate_item(self, item: PpthubInitItem) -> str | None:
		if not item.file_url or not item.thumbnail_url:
			return 'missing_url'
		if item.category not in self._valid_categories:
			return 'invalid_category'
		if item.language not in self._valid_languages:
			return 'invalid_language'
		if not item.title:
			return 'missing_title'
		return None


def apply_final_gate(
	conn,
	*,
	source_batch_id: str,
	items: list[PpthubInitItem],
	validator: FinalGateValidator,
):
	from datetime import datetime, timezone

	started_at = datetime.now(timezone.utc)
	result = validator.validate_items(items)

	for item, reason in result.blocked:
		upsert_processed_asset(
			conn,
			aid=item.id.replace('ppt_', ''),
			source_batch_id=source_batch_id,
			fields={'export_status': 'export_blocked'},
		)

	for item in result.valid:
		upsert_processed_asset(
			conn,
			aid=item.id.replace('ppt_', ''),
			source_batch_id=source_batch_id,
			fields={'export_status': 'success'},
		)

	record_stage(
		conn,
		StageRecord(
			aid='*',
			stage=StageName.final_gate,
			status=StageStatus.export_blocked if result.blocked else StageStatus.success,
			started_at=started_at,
			finished_at=datetime.now(timezone.utc),
			error_code=None,
			error_message=None,
			warnings=result.warnings,
			artifacts={'blocked': [reason for _, reason in result.blocked]},
		),
	)

	return result
