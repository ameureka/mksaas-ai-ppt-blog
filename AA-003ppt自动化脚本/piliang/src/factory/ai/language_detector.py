"""
LanguageDetector 模块
负责基于字符占比检测语言并映射到 PPTHub 前端值
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class LanguageDetectionResult:
	"""语言检测结果"""

	code: Literal['zh', 'en', 'other']
	display: Literal['中文', 'English', '其他']
	chinese_ratio: float
	english_ratio: float
	source: Literal['rule', 'ai', 'fallback'] = 'rule'


class LanguageDetector:
	"""语言检测器"""

	# 语言代码到显示名称的映射
	_CODE_TO_DISPLAY: dict[str, str] = {
		'zh': '中文',
		'en': 'English',
		'other': '其他',
	}

	# 显示名称到代码的映射
	_DISPLAY_TO_CODE: dict[str, str] = {
		'中文': 'zh',
		'English': 'en',
		'其他': 'other',
	}

	# 有效的显示名称集合
	_VALID_DISPLAYS = {'中文', 'English', '其他'}

	def __init__(
		self, *, chinese_threshold: float = 0.3, english_threshold: float = 0.7
	) -> None:
		"""
		初始化语言检测器

		Args:
			chinese_threshold: 中文字符占比阈值，超过此值判定为中文
			english_threshold: 英文字符占比阈值，超过此值判定为英文
		"""
		self._chinese_threshold = chinese_threshold
		self._english_threshold = english_threshold

	def detect(self, text: str) -> LanguageDetectionResult:
		"""
		基于字符占比检测语言

		检测规则：
		- 中文字符占比 > 30% → zh
		- 英文字符占比 > 70% → en
		- 否则 → other

		Args:
			text: 待检测的文本

		Returns:
			LanguageDetectionResult 对象
		"""
		if not text:
			return LanguageDetectionResult(
				code='other',
				display='其他',
				chinese_ratio=0.0,
				english_ratio=0.0,
				source='rule',
			)

		char_count = len(text)
		chinese_count = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
		english_count = sum(1 for c in text if c.isalpha() and c.isascii())

		chinese_ratio = chinese_count / char_count if char_count > 0 else 0.0
		english_ratio = english_count / char_count if char_count > 0 else 0.0

		# 应用检测规则
		if chinese_ratio > self._chinese_threshold:
			code = 'zh'
		elif english_ratio > self._english_threshold:
			code = 'en'
		else:
			code = 'other'

		display = self._CODE_TO_DISPLAY[code]

		return LanguageDetectionResult(
			code=code,
			display=display,  # type: ignore[arg-type]
			chinese_ratio=chinese_ratio,
			english_ratio=english_ratio,
			source='rule',
		)

	def map_to_display(self, code: str) -> str:
		"""
		将语言代码映射到 PPTHub 前端显示值

		Args:
			code: 语言代码 (zh/en/other)

		Returns:
			显示名称 (中文/English/其他)
		"""
		return self._CODE_TO_DISPLAY.get(code, '其他')

	def map_to_code(self, display: str) -> str:
		"""
		将 PPTHub 前端显示值映射到语言代码

		Args:
			display: 显示名称 (中文/English/其他)

		Returns:
			语言代码 (zh/en/other)
		"""
		return self._DISPLAY_TO_CODE.get(display, 'other')

	def is_valid_display(self, display: str) -> bool:
		"""
		检查显示名称是否有效

		Args:
			display: 显示名称

		Returns:
			是否为有效的显示名称
		"""
		return display in self._VALID_DISPLAYS

	def merge_with_ai(
		self, rule_result: LanguageDetectionResult, ai_language: str | None
	) -> LanguageDetectionResult:
		"""
		合并规则检测结果与 AI 输出

		优先级：
		1. AI 输出（如果有效）
		2. 规则检测结果

		Args:
			rule_result: 规则检测结果
			ai_language: AI 输出的语言值

		Returns:
			合并后的 LanguageDetectionResult
		"""
		# 如果 AI 输出为空或无效，使用规则结果
		if not ai_language or not self.is_valid_display(ai_language):
			return LanguageDetectionResult(
				code=rule_result.code,
				display=rule_result.display,
				chinese_ratio=rule_result.chinese_ratio,
				english_ratio=rule_result.english_ratio,
				source='fallback',
			)

		# AI 输出有效，使用 AI 结果
		code = self.map_to_code(ai_language)
		return LanguageDetectionResult(
			code=code,  # type: ignore[arg-type]
			display=ai_language,  # type: ignore[arg-type]
			chinese_ratio=rule_result.chinese_ratio,
			english_ratio=rule_result.english_ratio,
			source='ai',
		)
