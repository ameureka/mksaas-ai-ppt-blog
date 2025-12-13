from __future__ import annotations

import re
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from pptx import Presentation

from ..db.dao import record_stage, upsert_processed_asset
from ..stages import StageName, StageStatus
from ..types import CleanOutput, EtlOutput, StageRecord


@dataclass(frozen=True)
class WorkshopBConfig:
	output_dir: Path
	forbidden_keywords: list[str]
	brand_end_slide_path: Path | None = None  # reserved for 6.2


def _replace_tokens(text: str, forbidden: list[str]) -> str:
	updated = text
	for token in forbidden:
		if not token:
			continue
		updated = updated.replace(token, '')
	return updated


def _clean_text_runs(slide, forbidden: list[str], *, hit_counter: dict[str, int]) -> None:
	for shape in slide.shapes:
		if not shape.has_text_frame:
			continue
		for paragraph in shape.text_frame.paragraphs:
			for run in paragraph.runs:
				original = run.text or ''
				cleaned = _replace_tokens(original, forbidden)
				if cleaned != original:
					hit_counter['replaced'] += 1
				run.text = cleaned


def _clean_core_properties(prs: Presentation, forbidden: list[str], *, hit_counter: dict[str, int]) -> None:
	props = prs.core_properties
	fields = ['title', 'subject', 'keywords', 'comments', 'last_modified_by', 'author', 'category']
	for field in fields:
		original = getattr(props, field, None)
		if not isinstance(original, str):
			continue
		cleaned = _replace_tokens(original, forbidden)
		if cleaned != original:
			hit_counter['replaced'] += 1
		setattr(props, field, cleaned)


class WorkshopB:
	def __init__(self, config: WorkshopBConfig) -> None:
		self._config = config

	@staticmethod
	def _slide_contains_forbidden(slide, forbidden: list[str]) -> bool:
		for shape in slide.shapes:
			if not shape.has_text_frame:
				continue
			text = shape.text
			for token in forbidden:
				if token and token in text:
					return True
		return False

	@staticmethod
	def _remove_slide(prs: Presentation, index: int) -> None:
		sldIdLst = prs.slides._sldIdLst  # type: ignore[attr-defined]
		sldId = sldIdLst[index]
		sldIdLst.remove(sldId)

	@staticmethod
	def _append_brand_slide(prs: Presentation, brand_path: Path) -> None:
		if not brand_path.exists():
			return
		brand_prs = Presentation(str(brand_path))
		if not brand_prs.slides:
			return
		source_slide = brand_prs.slides[0]
		blank_layout = prs.slide_layouts[6] if len(prs.slide_layouts) > 6 else prs.slide_layouts[0]
		new_slide = prs.slides.add_slide(blank_layout)

		# Remove placeholder shapes in the new blank slide.
		for shape in list(new_slide.shapes):
			new_slide.shapes._spTree.remove(shape._element)  # type: ignore[attr-defined]

		# Deep copy shapes from the template slide.
		for shape in source_slide.shapes:
			new_slide.shapes._spTree.insert_element_before(deepcopy(shape._element), 'p:extLst')  # type: ignore[attr-defined]

	def deep_clean(self, etl_out: EtlOutput) -> CleanOutput:
		"""
		Remove forbidden keywords from slides and core properties.
		Remove tail slides (last 3 + trailing forbidden) and append brand end slide if provided.
		"""
		if not etl_out.local_pptx_path.exists():
			raise FileNotFoundError(f'PPTX not found: {etl_out.local_pptx_path}')

		prs = Presentation(etl_out.local_pptx_path)
		hits = {'replaced': 0}

		# Collect forbidden markers per slide before replacement for tail pruning.
		slide_flags = [
			self._slide_contains_forbidden(slide, self._config.forbidden_keywords) for slide in prs.slides
		]

		removed = 0
		# Remove last 3 slides.
		for _ in range(min(3, len(slide_flags))):
			self._remove_slide(prs, len(prs.slides) - 1)
			slide_flags.pop()
			removed += 1

		# Remove trailing slides still containing forbidden keywords.
		while slide_flags and slide_flags[-1]:
			self._remove_slide(prs, len(prs.slides) - 1)
			slide_flags.pop()
			removed += 1

		for slide in prs.slides:
			_clean_text_runs(slide, self._config.forbidden_keywords, hit_counter=hits)
		_clean_core_properties(prs, self._config.forbidden_keywords, hit_counter=hits)

		output_dir = self._config.output_dir / etl_out.channel_id
		output_dir.mkdir(parents=True, exist_ok=True)
		output_path = output_dir / f'{etl_out.aid}-clean.pptx'

		brand_inserted = False
		if self._config.brand_end_slide_path:
			self._append_brand_slide(prs, self._config.brand_end_slide_path)
			brand_inserted = True

		prs.save(output_path)

		warnings = ['WARN_FORBIDDEN_REPLACED'] if hits['replaced'] > 0 else []
		if removed > 0:
			warnings.append('WARN_TAIL_REMOVED')
		if brand_inserted:
			warnings.append('WARN_BRAND_APPENDED')

		return CleanOutput(
			aid=etl_out.aid,
			channel_id=etl_out.channel_id,
			clean_pptx_path=output_path,
			forbidden_keywords=list(self._config.forbidden_keywords),
			warnings=warnings,
		)


def run_clean(
	conn,
	*,
	source_batch_id: str,
	etl_out: EtlOutput,
	workshop: WorkshopB,
) -> CleanOutput:
	started_at = datetime.now(timezone.utc)
	try:
		out = workshop.deep_clean(etl_out)
		# Validate the cleaned pptx is still readable.
		_ = Presentation(out.clean_pptx_path)
		upsert_processed_asset(
			conn,
			aid=etl_out.aid,
			source_batch_id=source_batch_id,
			fields={
				'local_pptx_path': out.clean_pptx_path,
				'local_cover_path': etl_out.local_cover_path,
			},
		)
		status = StageStatus.success
		error_code = None
		error_message = None
		warnings = out.warnings
		artifacts = {
			'clean_pptx_path': str(out.clean_pptx_path),
			'forbidden_keywords': out.forbidden_keywords,
		}
	except Exception as exc:  # noqa: BLE001
		out = None
		status = StageStatus.failed
		error_code = 'CLEAN_FAILED'
		error_message = str(exc)
		warnings = []
		artifacts = {}
	finally:
		finished_at = datetime.now(timezone.utc)

	record_stage(
		conn,
		StageRecord(
			aid=etl_out.aid,
			stage=StageName.B,
			status=status,
			started_at=started_at,
			finished_at=finished_at,
			error_code=error_code,
			error_message=error_message,
			warnings=warnings,
			artifacts=artifacts,
		),
	)

	if status != StageStatus.success or out is None:
		raise ValueError(error_message or 'CLEAN failed')

	return out
