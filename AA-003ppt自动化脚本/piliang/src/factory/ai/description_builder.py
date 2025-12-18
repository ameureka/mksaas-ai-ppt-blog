"""
DescriptionBuilder 模块
负责基于 AI 输出生成 description_final
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class BuiltDescription:
	"""构建的描述结果"""

	description: str
	source: Literal['ai_summary', 'title_scenario', 'title_scenario_structure']
	original_length: int
	final_length: int


class DescriptionBuilder:
	"""描述构建器"""

	def __init__(
		self,
		*,
		forbidden_keywords: list[str],
		min_length: int = 50,
		max_length: int = 500,
	) -> None:
		"""
		初始化描述构建器

		Args:
			forbidden_keywords: 敏感词列表
			min_length: 最小描述长度
			max_length: 最大描述长度
		"""
		self._forbidden = [kw for kw in forbidden_keywords if kw]
		self._min_length = min_length
		self._max_length = max_length

	def build(
		self,
		*,
		ai_summary: str,
		title: str,
		ai_scenario: str,
		ai_structure_features: str,
	) -> BuiltDescription:
		"""
		构建 description_final

		派生链：
		1. 首选 ai_summary（若长度 ≥ 20）
		2. 否则 title + ' - ' + ai_scenario
		3. 若仍 < 50 字，追加 ai_structure_features
		4. 截断到 500 字
		5. 过滤敏感词

		Args:
			ai_summary: AI 生成的摘要
			title: 标题
			ai_scenario: AI 生成的场景描述
			ai_structure_features: AI 生成的结构特点

		Returns:
			BuiltDescription 对象
		"""
		description = ''
		source: Literal['ai_summary', 'title_scenario', 'title_scenario_structure'] = 'ai_summary'

		# 步骤 1: 首选 ai_summary
		if ai_summary and len(ai_summary.strip()) >= 20:
			description = ai_summary.strip()
			source = 'ai_summary'
		else:
			# 步骤 2: 使用 title + scenario
			parts = []
			if title:
				parts.append(title.strip())
			if ai_scenario:
				parts.append(ai_scenario.strip())

			if parts:
				description = ' - '.join(parts)
				source = 'title_scenario'
			else:
				# 如果 title 和 scenario 都为空，使用 structure_features
				description = ai_structure_features.strip() if ai_structure_features else ''
				source = 'title_scenario_structure'

		original_length = len(description)

		# 步骤 3: 如果长度不足，追加 structure_features
		if len(description) < self._min_length and ai_structure_features:
			structure_text = ai_structure_features.strip()
			if structure_text:
				if description:
					description = f'{description}。{structure_text}'
				else:
					description = structure_text
				source = 'title_scenario_structure'

		# 步骤 4: 截断到最大长度
		if len(description) > self._max_length:
			description = description[: self._max_length]

		# 步骤 5: 过滤敏感词
		description = self._filter_forbidden(description)

		final_length = len(description)

		return BuiltDescription(
			description=description,
			source=source,
			original_length=original_length,
			final_length=final_length,
		)

	def _filter_forbidden(self, text: str) -> str:
		"""
		过滤敏感词（替换为空）

		Args:
			text: 原始文本

		Returns:
			过滤后的文本
		"""
		filtered = text
		for keyword in self._forbidden:
			if keyword:
				filtered = filtered.replace(keyword, '')
		return filtered
