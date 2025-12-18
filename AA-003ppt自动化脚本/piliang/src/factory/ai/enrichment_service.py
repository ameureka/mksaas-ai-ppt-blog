"""
AIEnrichmentService 模块
统一的 AI Enrichment 服务，整合所有模块
"""

from __future__ import annotations

import logging
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

from .ai_adapter import AIAdapter, AIAdapterConfig, AICallResult
from .ai_parser import AiParser, ParsedAiMeta, ParseResult
from .batch_processor import (
	AssetInput,
	AssetProcessResult,
	BatchProcessor,
	BatchProcessorConfig,
	BatchProcessReport,
	ProcessStatus,
	create_asset_input,
	create_failed_result,
	create_success_result,
)
from .config_loader import AIEnrichmentConfig, ConfigLoader
from .description_builder import BuiltDescription, DescriptionBuilder
from .field_merger import (
	AiEnrichmentOutput,
	FieldMerger,
	FieldMergerConfig,
	MergeInput,
)
from .language_detector import LanguageDetectionResult, LanguageDetector
from .prompt_template import PromptTemplate, PromptTemplateConfig
from .tags_normalizer import NormalizedTags, TagsNormalizer
from .text_extractor import ExtractedText, TextExtractor

logger = logging.getLogger(__name__)


@dataclass
class EtlOutput:
	"""车间 B 输出（AI Enrichment 输入）"""

	aid: str
	channel_id: str
	local_pptx_path: Path
	meta: dict[str, Any]


@dataclass(frozen=True)
class EnrichmentResult:
	"""单个 Asset 的 Enrichment 结果"""

	aid: str
	success: bool
	output: AiEnrichmentOutput | None = None
	error_code: str | None = None
	error_message: str | None = None
	rule_matched: bool = False
	ai_called: bool = False


@dataclass(frozen=True)
class EnrichmentServiceConfig:
	"""Enrichment 服务配置"""

	# 配置加载
	project_root: Path | None = None
	env: dict[str, str] | None = None

	# AI 调用配置
	ai_command_template: list[str] | None = None
	ai_timeout_seconds: int = 60
	ai_max_retries: int = 2

	# 批量处理配置
	max_concurrency: int = 1
	batch_max_retries: int = 2

	# 派生字段配置
	description_min_length: int = 50
	description_max_length: int = 500
	tags_min_count: int = 3
	tags_max_count: int = 8


class AIEnrichmentService:
	"""AI Enrichment 服务"""

	def __init__(
		self,
		config: EnrichmentServiceConfig | None = None,
		*,
		ai_config: AIEnrichmentConfig | None = None,
	) -> None:
		"""
		初始化 AI Enrichment 服务

		Args:
			config: 服务配置
			ai_config: AI 配置（可选，如果提供则跳过配置加载）
		"""
		self._service_config = config or EnrichmentServiceConfig()

		# 加载或使用提供的配置
		if ai_config is not None:
			self._config = ai_config
		else:
			loader = ConfigLoader(
				project_root=self._service_config.project_root,
				env=self._service_config.env,
			)
			self._config = loader.load_or_raise()

		# 初始化组件
		self._init_components()

	def _init_components(self) -> None:
		"""初始化所有组件"""
		# 文本提取器
		self._text_extractor = TextExtractor()

		# 语言检测器
		self._language_detector = LanguageDetector()

		# 标签标准化器
		self._tags_normalizer = TagsNormalizer(
			forbidden_keywords=self._config.forbidden_keywords,
			min_count=self._service_config.tags_min_count,
			max_count=self._service_config.tags_max_count,
		)

		# 描述构建器
		self._description_builder = DescriptionBuilder(
			forbidden_keywords=self._config.forbidden_keywords,
			min_length=self._service_config.description_min_length,
			max_length=self._service_config.description_max_length,
		)

		# AI 解析器
		self._ai_parser = AiParser(
			forbidden_keywords=self._config.forbidden_keywords,
			valid_categories=self._config.valid_categories,
		)

		# 字段合并器
		self._field_merger = FieldMerger(
			FieldMergerConfig(
				valid_categories=self._config.valid_categories,
				fallback_category=self._config.fallback_category,
			)
		)

		# AI 适配器（如果有命令模板）
		command_template = (
			self._service_config.ai_command_template
			or self._config.ai_command_template
		)
		self._ai_adapter = AIAdapter(
			AIAdapterConfig(
				command_template=command_template,
				timeout_seconds=self._service_config.ai_timeout_seconds,
				max_retries=self._service_config.ai_max_retries,
				pending_dir=self._config.ai_pending_dir,
				completed_dir=self._config.ai_completed_dir,
			)
		)

		# Prompt 模板（如果存在）
		self._prompt_template: PromptTemplate | None = None
		if self._config.prompt_template_path:
			self._prompt_template = PromptTemplate(
				PromptTemplateConfig(template_path=self._config.prompt_template_path)
			)

		# 批量处理器
		self._batch_processor = BatchProcessor(
			BatchProcessorConfig(
				max_concurrency=self._service_config.max_concurrency,
				max_retries=self._service_config.batch_max_retries,
			)
		)

	def enrich_single(
		self,
		etl_output: EtlOutput,
		*,
		rule_engine: Any | None = None,
		skip_ai: bool = False,
	) -> EnrichmentResult:
		"""
		处理单个 Asset

		Args:
			etl_output: 车间 B 输出
			rule_engine: 规则引擎（可选）
			skip_ai: 是否跳过 AI 调用

		Returns:
			EnrichmentResult 对象
		"""
		aid = etl_output.aid
		meta = etl_output.meta

		try:
			# 1. 提取文本
			extracted_text = self._text_extractor.extract(etl_output.local_pptx_path)

			# 2. 语言检测
			language_detection = self._language_detector.detect(extracted_text.full_text)

			# 3. 规则匹配（如果有规则引擎）
			rule_category: str | None = None
			rule_matched = False
			if rule_engine is not None:
				title = meta.get('title', '')
				original_tags = meta.get('tags', [])
				rule_category = rule_engine.match(title=title, tags=original_tags)
				rule_matched = rule_category is not None

			# 4. AI 调用（如果规则未命中且不跳过）
			ai_meta: ParsedAiMeta | None = None
			ai_called = False
			ai_call_failed = False
			ai_error_message: str | None = None

			if not rule_matched and not skip_ai and self._prompt_template:
				ai_called = True
				ai_result = self._call_ai(etl_output, extracted_text)

				if ai_result.success and ai_result.payload:
					parse_result = self._ai_parser.parse_safe(ai_result.payload)
					if parse_result.success:
						ai_meta = parse_result.meta
						# 合并 AI 语言检测
						if ai_meta:
							language_detection = self._language_detector.merge_with_ai(
								language_detection, ai_meta.language
							)
					else:
						ai_call_failed = True
						ai_error_message = parse_result.error_message
				else:
					ai_call_failed = True
					ai_error_message = ai_result.error_message

			# 5. 标签标准化
			ai_keywords = ai_meta.ai_keywords if ai_meta else []
			original_tags = meta.get('tags', [])
			title = meta.get('title', '')
			normalized_tags = self._tags_normalizer.normalize(
				ai_keywords=ai_keywords,
				original_tags=original_tags,
				title=title,
			)

			# 6. 描述构建
			ai_summary = ai_meta.ai_summary if ai_meta else ''
			ai_scenario = ai_meta.ai_scenario if ai_meta else ''
			ai_structure_features = ai_meta.ai_structure_features if ai_meta else ''
			built_description = self._description_builder.build(
				ai_summary=ai_summary,
				title=title,
				ai_scenario=ai_scenario,
				ai_structure_features=ai_structure_features,
			)

			# 7. 字段合并
			merge_input = MergeInput(
				aid=aid,
				ai_meta=ai_meta,
				rule_category=rule_category,
				language_detection=language_detection,
				normalized_tags=normalized_tags,
				built_description=built_description,
				ai_call_failed=ai_call_failed,
				ai_error_message=ai_error_message,
			)
			output = self._field_merger.merge(merge_input)

			return EnrichmentResult(
				aid=aid,
				success=True,
				output=output,
				rule_matched=rule_matched,
				ai_called=ai_called,
			)

		except Exception as e:
			logger.error(f'Error enriching {aid}: {e}')
			return EnrichmentResult(
				aid=aid,
				success=False,
				error_code='ENRICHMENT_ERROR',
				error_message=str(e),
			)

	def _call_ai(
		self, etl_output: EtlOutput, extracted_text: ExtractedText
	) -> AICallResult:
		"""
		调用 AI

		Args:
			etl_output: ETL 输出
			extracted_text: 提取的文本

		Returns:
			AICallResult 对象
		"""
		if not self._prompt_template:
			return AICallResult(
				success=False,
				output_path=None,
				payload=None,
				error_code='NO_PROMPT_TEMPLATE',
				error_message='Prompt template not configured',
				duration_ms=0,
			)

		# 渲染 Prompt
		meta = etl_output.meta
		prompt_content = self._prompt_template.render(
			title=meta.get('title', ''),
			original_tags=meta.get('tags', []),
			extracted_text=extracted_text.full_text[:5000],  # 限制长度
			channel_name=etl_output.channel_id,
		)

		# 写入 Prompt 文件
		prompt_path = self._config.ai_pending_dir / f'{etl_output.aid}.md'
		prompt_path.parent.mkdir(parents=True, exist_ok=True)
		prompt_path.write_text(prompt_content, encoding='utf-8')

		# 调用 AI
		output_path = self._config.ai_completed_dir / f'{etl_output.aid}.json'
		output_path.parent.mkdir(parents=True, exist_ok=True)

		return self._ai_adapter.run_with_retry(prompt_path, output_path)

	def enrich_batch(
		self,
		*,
		batch_id: str,
		etl_outputs: list[EtlOutput],
		rule_engine: Any | None = None,
		skip_ai: bool = False,
	) -> BatchProcessReport:
		"""
		批量处理 Assets

		Args:
			batch_id: 批次 ID
			etl_outputs: ETL 输出列表
			rule_engine: 规则引擎（可选）
			skip_ai: 是否跳过 AI 调用

		Returns:
			BatchProcessReport 对象
		"""
		# 转换为 AssetInput
		assets = [
			create_asset_input(etl.aid, etl)
			for etl in etl_outputs
		]

		# 定义处理函数
		def process_func(asset: AssetInput) -> AssetProcessResult:
			etl_output: EtlOutput = asset.data
			result = self.enrich_single(
				etl_output,
				rule_engine=rule_engine,
				skip_ai=skip_ai,
			)

			if result.success:
				return create_success_result(asset.aid, output=result.output)
			else:
				return create_failed_result(
					asset.aid,
					result.error_code or 'UNKNOWN_ERROR',
					result.error_message or 'Unknown error',
				)

		# 批量处理
		return self._batch_processor.process(
			batch_id=batch_id,
			assets=assets,
			process_func=process_func,
		)

	def persist_results(
		self,
		conn: sqlite3.Connection,
		*,
		source_batch_id: str,
		report: BatchProcessReport,
	) -> int:
		"""
		持久化批量处理结果

		Args:
			conn: SQLite 连接
			source_batch_id: 批次 ID
			report: 批量处理报告

		Returns:
			更新的行数
		"""
		outputs = [
			r.output
			for r in report.results
			if r.status == ProcessStatus.SUCCESS and r.output is not None
		]

		return self._field_merger.persist_batch(
			conn,
			source_batch_id=source_batch_id,
			outputs=outputs,
		)


def create_etl_output(
	*,
	aid: str,
	channel_id: str,
	local_pptx_path: Path | str,
	meta: dict[str, Any] | None = None,
) -> EtlOutput:
	"""
	便捷函数：创建 EtlOutput

	Args:
		aid: Asset ID
		channel_id: 频道 ID
		local_pptx_path: 本地 PPTX 路径
		meta: 元数据

	Returns:
		EtlOutput 对象
	"""
	return EtlOutput(
		aid=aid,
		channel_id=channel_id,
		local_pptx_path=Path(local_pptx_path),
		meta=meta or {},
	)
