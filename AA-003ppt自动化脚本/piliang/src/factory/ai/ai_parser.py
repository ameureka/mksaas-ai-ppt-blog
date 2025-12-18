"""
AIParser 模块
负责解析、校验 AI 输出 JSON，检测敏感词
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


@dataclass(frozen=True)
class ParsedAiMeta:
	"""解析后的 AI 元数据"""

	ai_summary: str
	ai_keywords: list[str]
	ai_scenario: str
	ai_color_scheme: str
	ai_structure_features: str
	ai_template_features: str
	ppthub_category: str
	language: Literal['中文', 'English', '其他']
	warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ParseResult:
	"""解析结果（增强版）"""

	success: bool
	meta: ParsedAiMeta | None
	error_code: str | None
	error_message: str | None
	forbidden_hits: list[str] = field(default_factory=list)
	missing_fields: list[str] = field(default_factory=list)
	invalid_fields: list[str] = field(default_factory=list)


class AiParser:
	"""AI 输出解析器"""

	_required_fields = [
		'ai_summary',
		'ai_keywords',
		'ai_scenario',
		'ai_color_scheme',
		'ai_structure_features',
		'ai_template_features',
		'ppthub_category',
		'language',
	]

	_valid_languages = {'中文', 'English', '其他'}

	def __init__(self, *, forbidden_keywords: list[str], valid_categories: set[str]) -> None:
		"""
		初始化解析器

		Args:
			forbidden_keywords: 敏感词列表
			valid_categories: 有效的分类 slug 集合
		"""
		self._forbidden = [kw for kw in forbidden_keywords if kw]
		self._valid_categories = valid_categories

	def parse(self, payload: dict[str, Any]) -> ParsedAiMeta:
		"""
		解析 AI 输出（兼容旧接口）

		Args:
			payload: AI 输出的 JSON 对象

		Returns:
			ParsedAiMeta 对象

		Raises:
			ValueError: 解析失败
		"""
		result = self.parse_safe(payload)
		if not result.success:
			raise ValueError(f'{result.error_code}: {result.error_message}')
		if result.meta is None:
			raise ValueError('Parse result meta is None')
		return result.meta

	def parse_safe(self, payload: dict[str, Any]) -> ParseResult:
		"""
		安全解析 AI 输出（不抛异常）

		Args:
			payload: AI 输出的 JSON 对象

		Returns:
			ParseResult 对象
		"""
		warnings: list[str] = []
		missing_fields: list[str] = []
		invalid_fields: list[str] = []

		# 检查必需字段
		for key in self._required_fields:
			if key not in payload:
				missing_fields.append(key)

		if missing_fields:
			return ParseResult(
				success=False,
				meta=None,
				error_code='AI_MISSING_FIELD',
				error_message=f'Missing fields: {", ".join(missing_fields)}',
				missing_fields=missing_fields,
			)

		# 解析 ai_summary
		ai_summary = str(payload['ai_summary']).strip()
		if len(ai_summary) == 0:
			invalid_fields.append('ai_summary')
			return ParseResult(
				success=False,
				meta=None,
				error_code='AI_FIELD_INVALID',
				error_message='ai_summary is empty',
				invalid_fields=invalid_fields,
			)
		if len(ai_summary) > 200:
			ai_summary = ai_summary[:200]
			warnings.append('ai_summary truncated to 200 chars')

		# 解析 ai_keywords
		ai_keywords = self._normalize_list(payload['ai_keywords'])
		if len(ai_keywords) == 0:
			warnings.append('ai_keywords is empty')
		elif len(ai_keywords) > 20:
			ai_keywords = ai_keywords[:20]
			warnings.append('ai_keywords truncated to 20 items')

		# 解析其他字段
		ai_scenario = str(payload['ai_scenario']).strip()
		ai_color_scheme = str(payload['ai_color_scheme']).strip()
		ai_structure_features = str(payload['ai_structure_features']).strip()
		ai_template_features = str(payload['ai_template_features']).strip()
		ppthub_category = str(payload['ppthub_category']).strip()
		language = str(payload['language']).strip()

		# 校验 ppthub_category
		if ppthub_category not in self._valid_categories:
			warnings.append(f'invalid category "{ppthub_category}", fallback to "general"')
			ppthub_category = 'general'

		# 校验 language
		if language not in self._valid_languages:
			warnings.append(f'invalid language "{language}", fallback to "其他"')
			language = '其他'

		# 检测敏感词
		forbidden_hits = self._detect_all_forbidden([
			ai_summary,
			ai_scenario,
			ai_color_scheme,
			ai_structure_features,
			ai_template_features,
			' '.join(ai_keywords),
		])

		if forbidden_hits:
			return ParseResult(
				success=False,
				meta=None,
				error_code='AI_FORBIDDEN_KEYWORD',
				error_message=f'Forbidden keywords detected: {", ".join(forbidden_hits)}',
				forbidden_hits=forbidden_hits,
			)

		meta = ParsedAiMeta(
			ai_summary=ai_summary,
			ai_keywords=ai_keywords,
			ai_scenario=ai_scenario,
			ai_color_scheme=ai_color_scheme,
			ai_structure_features=ai_structure_features,
			ai_template_features=ai_template_features,
			ppthub_category=ppthub_category,
			language=language,  # type: ignore[arg-type]
			warnings=warnings,
		)

		return ParseResult(
			success=True,
			meta=meta,
			error_code=None,
			error_message=None,
		)

	def _normalize_list(self, value: Any) -> list[str]:
		"""将值标准化为字符串列表"""
		if isinstance(value, list):
			return [str(v).strip() for v in value if str(v).strip()]
		if isinstance(value, str):
			return [value.strip()] if value.strip() else []
		return []

	def _detect_forbidden(self, texts: list[str]) -> str | None:
		"""检测敏感词（返回首个命中）"""
		for text in texts:
			for kw in self._forbidden:
				if kw and kw in text:
					return kw
		return None

	def _detect_all_forbidden(self, texts: list[str]) -> list[str]:
		"""检测所有敏感词"""
		hits: list[str] = []
		for text in texts:
			for kw in self._forbidden:
				if kw and kw in text and kw not in hits:
					hits.append(kw)
		return hits
