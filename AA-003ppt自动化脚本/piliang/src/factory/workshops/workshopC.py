from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..ai import AIAdapter, AIAdapterConfig, AiParser, PromptBuilder, PromptBuilderConfig
from ..db.dao import record_stage, upsert_processed_asset
from ..rules import RuleEngine, RuleEngineConfig
from ..stages import StageName, StageStatus
from ..types import CleanOutput, EtlOutput, StageRecord


def _split_keywords(raw: str) -> list[str]:
	items: list[str] = []
	for part in raw.replace(',', '\n').splitlines():
		kw = part.strip()
		if not kw:
			continue
		if kw.startswith('#'):
			continue
		items.append(kw)
	# de-dup while keeping order
	seen: set[str] = set()
	unique: list[str] = []
	for kw in items:
		if kw in seen:
			continue
		seen.add(kw)
		unique.append(kw)
	return unique


def _load_valid_categories(mapping_path: Path) -> set[str]:
	import yaml  # type: ignore

	if not mapping_path.exists():
		return {'general'}
	data = yaml.safe_load(mapping_path.read_text(encoding='utf-8'))
	if not isinstance(data, dict):
		return {'general'}
	categories = data.get('categories') or {}
	if not isinstance(categories, dict):
		return {'general'}
	slugs = {str(k).strip() for k in categories.keys() if str(k).strip()}
	slugs.add('general')
	return slugs


def _load_forbidden_keywords(path: Path) -> list[str]:
	if not path.exists():
		return []
	return _split_keywords(path.read_text(encoding='utf-8'))


@dataclass(frozen=True)
class WorkshopCConfig:
	project_root: Path
	prompt_output_dir: Path
	ai_output_dir: Path
	ai_command: list[str]  # command template for AIAdapter


class WorkshopC:
	def __init__(self, config: WorkshopCConfig) -> None:
		self._config = config
		category_mapping_path = config.project_root / 'configs' / 'category-mapping.yaml'
		forbidden_path = config.project_root / 'configs' / 'forbidden-keywords.txt'
		template_path = config.project_root / 'templates' / 'ai_prompt_template.md'
		self._prompt_builder = PromptBuilder(
			PromptBuilderConfig(
				output_dir=config.prompt_output_dir,
				template_path=template_path if template_path.exists() else None,
			)
		)
		self._rule_engine = RuleEngine(RuleEngineConfig(mapping_path=category_mapping_path))
		self._ai_adapter = AIAdapter(AIAdapterConfig(command_template=config.ai_command))
		self._ai_parser = AiParser(
			forbidden_keywords=_load_forbidden_keywords(forbidden_path),
			valid_categories=_load_valid_categories(category_mapping_path),
		)

	def run(self, etl_out: EtlOutput, clean_out: CleanOutput | None = None) -> dict[str, Any]:
		title = etl_out.meta.get('title') or ''
		tags = etl_out.meta.get('original_tags') or []

		rule_slug = self._rule_engine.match(title=title, tags=tags)

		# Use cleaned PPTX if available (watermarks removed), otherwise fall back to original
		pptx_path = clean_out.clean_pptx_path if clean_out else etl_out.local_pptx_path

		# Always call AI to enrich metadata; rule engine only decides category priority.
		prompt_path = self._prompt_builder.build(
			aid=etl_out.aid,
			title=title,
			meta=etl_out.meta,
			pptx_path=pptx_path,
		)
		output_path = self._config.ai_output_dir / f'{etl_out.aid}.json'
		ai_payload = self._ai_adapter.run(prompt_path, output_path)
		try:
			parsed = self._ai_parser.parse(ai_payload)
		except Exception as exc:  # noqa: BLE001
			raise ValueError(f'AI output invalid: {exc}') from exc

		slug = rule_slug or parsed.ppthub_category
		fallback_reason = 'rule_hit_ai_enriched' if rule_slug else 'rule_miss_ai_used'

		ai_meta: dict[str, Any] = {
			'ai_summary': parsed.ai_summary,
			'ai_content_summary': parsed.ai_content_summary,
			'ai_keywords': parsed.ai_keywords,
			'ai_scenario': parsed.ai_scenario,
			'ai_color_scheme': parsed.ai_color_scheme,
			'ai_structure_features': parsed.ai_structure_features,
			'ai_template_features': parsed.ai_template_features,
			'ppthub_category': parsed.ppthub_category,
			'language': parsed.language,
		}

		return {
			'ppthub_category': slug,
			'ai_meta': ai_meta,
			'fallback_reason': fallback_reason,
			'rule_category': rule_slug,
			'ai_warnings': parsed.warnings,
		}


def run_ai_enrich(
	conn,
	*,
	source_batch_id: str,
	etl_out: EtlOutput,
	clean_out: CleanOutput | None = None,
	workshop: WorkshopC,
) -> dict[str, Any]:
	started_at = datetime.now(timezone.utc)
	try:
		result = workshop.run(etl_out, clean_out)
		ai_meta = result.get('ai_meta')
		fields: dict[str, Any] = {}
		if isinstance(ai_meta, dict):
			fields.update(ai_meta)
		fields['ppthub_category'] = result['ppthub_category']
		fields['language'] = (ai_meta or {}).get('language')
		upsert_processed_asset(
			conn,
			aid=etl_out.aid,
			source_batch_id=source_batch_id,
			fields=fields,
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings = list(result.get('ai_warnings') or [])
		artifacts = {
			'ppthub_category': result['ppthub_category'],
			'ai_meta': ai_meta,
			'fallback_reason': result.get('fallback_reason'),
			'rule_category': result.get('rule_category'),
		}
	except Exception as exc:  # noqa: BLE001
		status = StageStatus.failed
		error_code = 'AI_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
	finally:
		finished_at = datetime.now(timezone.utc)

	record_stage(
		conn,
		StageRecord(
			aid=etl_out.aid,
			stage=StageName.C,
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
		raise ValueError(error_message or 'AI enrichment failed')

	return result
