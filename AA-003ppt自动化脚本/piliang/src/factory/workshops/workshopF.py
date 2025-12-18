from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..types import PpthubInitItem


@dataclass(frozen=True)
class WorkshopFConfig:
	output_dir: Path


class WorkshopF:
	def __init__(self, config: WorkshopFConfig) -> None:
		self._config = config

	def export_json(self, *, batch_id: str, items: list[PpthubInitItem]) -> Path:
		self._config.output_dir.mkdir(parents=True, exist_ok=True)
		path = self._config.output_dir / f'ppthub-init-{batch_id}.json'

		payload = {
			'meta': {
				'schema_version': 'ppt-import-v2',
				'exported_at': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
				'natural_key': 'file_url',
				'source': 'piliang',
				'source_batch_id': batch_id,
			},
			'items': [asdict(item) for item in items],
		}

		path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
		return path

	def export_csv(self, *, batch_id: str, items: list[PpthubInitItem]) -> Path:
		self._config.output_dir.mkdir(parents=True, exist_ok=True)
		path = self._config.output_dir / f'ppthub-init-{batch_id}.csv'

		fieldnames = list(PpthubInitItem.__dataclass_fields__.keys())

		def normalize(value: Any) -> str:
			if value is None:
				return ''
			if isinstance(value, (str, int, float)):
				return str(value)
			return json.dumps(value, ensure_ascii=False)

		with path.open('w', encoding='utf-8', newline='') as f:
			writer = csv.DictWriter(f, fieldnames=fieldnames)
			writer.writeheader()
			for item in items:
				row = asdict(item)
				writer.writerow({k: normalize(v) for k, v in row.items()})

		return path

	def write_report(
		self,
		*,
		batch_id: str,
		valid: list[PpthubInitItem],
		blocked: list[tuple[PpthubInitItem, str]],
	) -> Path:
		self._config.output_dir.mkdir(parents=True, exist_ok=True)
		path = self._config.output_dir / f'ppthub-export-report-{batch_id}.json'

		reason_counts: dict[str, int] = {}
		for _, reason in blocked:
			reason_counts[reason] = reason_counts.get(reason, 0) + 1

		payload = {
			'batch_id': batch_id,
			'exported_at': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
			'total': len(valid) + len(blocked),
			'valid': len(valid),
			'blocked': len(blocked),
			'valid_items': [item.id for item in valid],
			'blocked_items': [{'id': item.id, 'reason': reason} for item, reason in blocked],
			'blocked_reasons': [
				{'reason': reason, 'count': count}
				for reason, count in sorted(reason_counts.items(), key=lambda kv: (-kv[1], kv[0]))
			],
		}

		path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
		return path

