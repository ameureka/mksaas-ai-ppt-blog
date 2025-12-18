"""
FieldMerger 模块
负责合并所有来源的字段并持久化到数据库
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from typing import Any, Literal

from .ai_parser import ParsedAiMeta
from .description_builder import BuiltDescription
from .language_detector import LanguageDetectionResult
from .tags_normalizer import NormalizedTags


@dataclass(frozen=True)
class AiEnrichmentOutput:
	"""AI Enrichment 输出结果"""

	aid: str

	# AI Meta Fields
	ai_summary: str
	ai_keywords: list[str]
	ai_scenario: str
	ai_color_scheme: str
	ai_structure_features: str
	ai_template_features: str
	ppthub_category: str
	language: Literal['中文', 'English', '其他']

	# Derived Fields
	tags_final: list[str]
	description_final: str

	# Source Tracking
	language_source: Literal['rule', 'ai', 'fallback']
	category_source: Literal['rule', 'ai', 'fallback']
	ai_fallback_reason: str | None = None

	# Warnings
	warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class MergeInput:
	"""合并输入"""

	aid: str
	ai_meta: ParsedAiMeta | None
	rule_category: str | None
	language_detection: LanguageDetectionResult
	normalized_tags: NormalizedTags
	built_description: BuiltDescription
	ai_call_failed: bool = False
	ai_error_message: str | None = None


@dataclass(frozen=True)
class FieldMergerConfig:
	"""FieldMerger 配置"""

	valid_categories: set[str] = field(default_factory=lambda: {
		'business', 'education', 'technology', 'design', 'marketing',
		'hr', 'medical', 'finance', 'general', 'summary', 'report', 'plan'
	})
	fallback_category: str = 'general'
	valid_languages: set[str] = field(default_factory=lambda: {'中文', 'English', '其他'})
	fallback_language: Literal['中文', 'English', '其他'] = '其他'


class FieldMerger:
	"""字段合并器"""

	def __init__(self, config: FieldMergerConfig | None = None) -> None:
		"""
		初始化字段合并器

		Args:
			config: 合并配置，默认使用 FieldMergerConfig()
		"""
		self._config = config or FieldMergerConfig()

	def merge(self, input_data: MergeInput) -> AiEnrichmentOutput:
		"""
		合并所有来源的字段

		规则优先策略：
		1. ppthub_category: rule_category > ai_meta.ppthub_category > fallback
		2. language: language_detection (已包含 rule/ai 合并逻辑)
		3. tags_final: normalized_tags
		4. description_final: built_description

		Args:
			input_data: 合并输入

		Returns:
			AiEnrichmentOutput 对象
		"""
		warnings: list[str] = []
		ai_fallback_reason: str | None = None

		# 1. 确定 ppthub_category 和 category_source
		ppthub_category, category_source, cat_fallback_reason = self._resolve_category(
			rule_category=input_data.rule_category,
			ai_meta=input_data.ai_meta,
			ai_call_failed=input_data.ai_call_failed,
		)
		if cat_fallback_reason:
			ai_fallback_reason = cat_fallback_reason

		# 2. 确定 language 和 language_source
		language = input_data.language_detection.display
		language_source = input_data.language_detection.source

		# 校验 language 合法性
		if language not in self._config.valid_languages:
			warnings.append(f'invalid language "{language}", fallback to "{self._config.fallback_language}"')
			language = self._config.fallback_language
			language_source = 'fallback'

		# 3. 获取 AI Meta 字段（如果有）
		if input_data.ai_meta is not None:
			ai_summary = input_data.ai_meta.ai_summary
			ai_keywords = list(input_data.ai_meta.ai_keywords)
			ai_scenario = input_data.ai_meta.ai_scenario
			ai_color_scheme = input_data.ai_meta.ai_color_scheme
			ai_structure_features = input_data.ai_meta.ai_structure_features
			ai_template_features = input_data.ai_meta.ai_template_features
			# 合并 AI 解析的 warnings
			warnings.extend(input_data.ai_meta.warnings)
		else:
			# AI 调用失败或未调用，使用空值
			ai_summary = ''
			ai_keywords = []
			ai_scenario = ''
			ai_color_scheme = ''
			ai_structure_features = ''
			ai_template_features = ''
			if input_data.ai_call_failed:
				warnings.append(f'AI call failed: {input_data.ai_error_message or "unknown error"}')

		# 4. 获取派生字段
		tags_final = list(input_data.normalized_tags.tags)
		description_final = input_data.built_description.description

		return AiEnrichmentOutput(
			aid=input_data.aid,
			ai_summary=ai_summary,
			ai_keywords=ai_keywords,
			ai_scenario=ai_scenario,
			ai_color_scheme=ai_color_scheme,
			ai_structure_features=ai_structure_features,
			ai_template_features=ai_template_features,
			ppthub_category=ppthub_category,
			language=language,  # type: ignore[arg-type]
			tags_final=tags_final,
			description_final=description_final,
			language_source=language_source,  # type: ignore[arg-type]
			category_source=category_source,
			ai_fallback_reason=ai_fallback_reason,
			warnings=warnings,
		)

	def _resolve_category(
		self,
		*,
		rule_category: str | None,
		ai_meta: ParsedAiMeta | None,
		ai_call_failed: bool,
	) -> tuple[str, Literal['rule', 'ai', 'fallback'], str | None]:
		"""
		解析 ppthub_category

		优先级：rule > ai > fallback

		Returns:
			(category, source, fallback_reason)
		"""
		# 1. 规则命中
		if rule_category is not None:
			if rule_category in self._config.valid_categories:
				return rule_category, 'rule', None
			# 规则返回了无效分类，记录警告但仍使用
			return rule_category, 'rule', None

		# 2. AI 输出
		if ai_meta is not None:
			ai_category = ai_meta.ppthub_category
			if ai_category in self._config.valid_categories:
				return ai_category, 'ai', 'rule_miss'
			# AI 输出无效分类，回退到 fallback
			return self._config.fallback_category, 'fallback', 'ai_invalid_fallback_general'

		# 3. AI 调用失败或未调用
		if ai_call_failed:
			return self._config.fallback_category, 'fallback', 'ai_call_failed'

		# 4. 规则未命中且无 AI 输出
		return self._config.fallback_category, 'fallback', 'rule_miss_no_ai'

	def persist(
		self,
		conn: sqlite3.Connection,
		*,
		source_batch_id: str,
		output: AiEnrichmentOutput,
	) -> None:
		"""
		持久化到数据库

		Args:
			conn: SQLite 连接
			source_batch_id: 批次 ID
			output: AI Enrichment 输出
		"""
		cursor = conn.cursor()

		# 序列化列表字段
		ai_keywords_json = json.dumps(output.ai_keywords, ensure_ascii=False)
		tags_final_json = json.dumps(output.tags_final, ensure_ascii=False)

		# 更新 processed_assets 表
		cursor.execute(
			"""
			UPDATE processed_assets
			SET
				ai_summary = ?,
				ai_keywords = ?,
				ai_scenario = ?,
				ai_color_scheme = ?,
				ai_structure_features = ?,
				ai_template_features = ?,
				ppthub_category = ?,
				language = ?,
				tags_final = ?,
				description_final = ?,
				language_source = ?,
				category_source = ?,
				ai_fallback_reason = ?
			WHERE aid = ? AND source_batch_id = ?
			""",
			(
				output.ai_summary,
				ai_keywords_json,
				output.ai_scenario,
				output.ai_color_scheme,
				output.ai_structure_features,
				output.ai_template_features,
				output.ppthub_category,
				output.language,
				tags_final_json,
				output.description_final,
				output.language_source,
				output.category_source,
				output.ai_fallback_reason,
				output.aid,
				source_batch_id,
			),
		)

		conn.commit()

	def persist_batch(
		self,
		conn: sqlite3.Connection,
		*,
		source_batch_id: str,
		outputs: list[AiEnrichmentOutput],
	) -> int:
		"""
		批量持久化到数据库

		Args:
			conn: SQLite 连接
			source_batch_id: 批次 ID
			outputs: AI Enrichment 输出列表

		Returns:
			更新的行数
		"""
		cursor = conn.cursor()
		updated = 0

		for output in outputs:
			ai_keywords_json = json.dumps(output.ai_keywords, ensure_ascii=False)
			tags_final_json = json.dumps(output.tags_final, ensure_ascii=False)

			cursor.execute(
				"""
				UPDATE processed_assets
				SET
					ai_summary = ?,
					ai_keywords = ?,
					ai_scenario = ?,
					ai_color_scheme = ?,
					ai_structure_features = ?,
					ai_template_features = ?,
					ppthub_category = ?,
					language = ?,
					tags_final = ?,
					description_final = ?,
					language_source = ?,
					category_source = ?,
					ai_fallback_reason = ?
				WHERE aid = ? AND source_batch_id = ?
				""",
				(
					output.ai_summary,
					ai_keywords_json,
					output.ai_scenario,
					output.ai_color_scheme,
					output.ai_structure_features,
					output.ai_template_features,
					output.ppthub_category,
					output.language,
					tags_final_json,
					output.description_final,
					output.language_source,
					output.category_source,
					output.ai_fallback_reason,
					output.aid,
					source_batch_id,
				),
			)
			updated += cursor.rowcount

		conn.commit()
		return updated


def create_merge_input(
	*,
	aid: str,
	ai_meta: ParsedAiMeta | None = None,
	rule_category: str | None = None,
	language_detection: LanguageDetectionResult,
	normalized_tags: NormalizedTags,
	built_description: BuiltDescription,
	ai_call_failed: bool = False,
	ai_error_message: str | None = None,
) -> MergeInput:
	"""
	便捷函数：创建 MergeInput

	Args:
		aid: Asset ID
		ai_meta: AI 解析结果
		rule_category: 规则匹配的分类
		language_detection: 语言检测结果
		normalized_tags: 标准化标签
		built_description: 构建的描述
		ai_call_failed: AI 调用是否失败
		ai_error_message: AI 错误消息

	Returns:
		MergeInput 对象
	"""
	return MergeInput(
		aid=aid,
		ai_meta=ai_meta,
		rule_category=rule_category,
		language_detection=language_detection,
		normalized_tags=normalized_tags,
		built_description=built_description,
		ai_call_failed=ai_call_failed,
		ai_error_message=ai_error_message,
	)
