from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

from .stages import StageName, StageStatus


@dataclass(frozen=True)
class CandidateAsset:
	aid: str
	channel_id: str
	detail_url: str | None
	file_path: Path | None
	cover_path: Path | None
	meta: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StandardInputPackage:
	aid: str
	channel_id: str
	root_dir: Path
	main_pptx_path: Path
	meta_path: Path
	cover_path: Path | None = None


@dataclass(frozen=True)
class EtlOutput:
	aid: str
	channel_id: str
	local_pptx_path: Path
	local_cover_path: Path | None
	pages_count: int
	file_size_kb: int
	file_format: Literal['pptx'] = 'pptx'
	origin_updated_at: datetime | None = None
	meta: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class CleanOutput:
	aid: str
	channel_id: str
	clean_pptx_path: Path
	forbidden_keywords: list[str] = field(default_factory=list)
	warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class AiMeta:
	ai_summary: str
	ai_keywords: list[str]
	ai_scenario: str
	ai_color_scheme: str
	ai_structure_features: str
	ai_template_features: str
	ppthub_category: str
	language: Literal['中文', 'English', '其他']
	fallback_reason: str | None = None


@dataclass(frozen=True)
class PackedOutput:
	aid: str
	channel_id: str
	output_dir: Path
	pptx_path: Path
	cover_path: Path | None
	ai_meta_path: Path | None


@dataclass(frozen=True)
class PublishOutput:
	aid: str
	category: str
	remote_pptx_path: str
	remote_thumb_path: str | None
	file_url_remote: str
	thumbnail_url_remote: str | None
	cover_url_remote: str | None
	publish_status: Literal['pending', 'success', 'failed'] = 'pending'


@dataclass(frozen=True)
class PpthubInitMeta:
	schema_version: Literal['ppt-import-v2']
	exported_at: str
	natural_key: Literal['file_url']
	source: Literal['piliang']
	source_batch_id: str


@dataclass(frozen=True)
class PpthubInitItem:
	id: str
	title: str
	category: str
	tags: list[str] = field(default_factory=list)
	description: str = ''
	language: Literal['中文', 'English', '其他'] = '中文'
	slides_count: int = 0
	file_url: str = ''
	thumbnail_url: str = ''
	cover_image_url: str | None = None
	file_size: int | None = None
	file_format: Literal['pptx'] | None = 'pptx'
	author: str | None = None
	status: Literal['published'] = 'published'
	visibility: Literal['public', 'private'] | None = 'public'
	download_count: int | None = 0
	view_count: int | None = 0
	created_at: str | None = None
	updated_at: str | None = None


@dataclass(frozen=True)
class StageRecord:
	aid: str
	stage: StageName
	status: StageStatus
	started_at: datetime | None = None
	finished_at: datetime | None = None
	error_code: str | None = None
	error_message: str | None = None
	warnings: list[str] = field(default_factory=list)
	artifacts: dict[str, Any] = field(default_factory=dict)

