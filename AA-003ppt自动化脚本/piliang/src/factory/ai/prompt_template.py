"""
PromptTemplate 模块
负责加载、校验和渲染 AI Prompt 模板
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class PromptTemplateConfig:
	"""Prompt 模板配置"""

	template_path: Path
	required_placeholders: list[str] = field(
		default_factory=lambda: ['{title}', '{original_tags}', '{extracted_text}', '{channel_name}']
	)
	required_output_fields: list[str] = field(
		default_factory=lambda: [
			'ai_summary',
			'ai_keywords',
			'ai_scenario',
			'ai_color_scheme',
			'ai_structure_features',
			'ai_template_features',
			'ppthub_category',
			'language',
		]
	)


class PromptTemplate:
	"""Prompt 模板管理器"""

	def __init__(self, config: PromptTemplateConfig) -> None:
		self._config = config
		self._template_content: str | None = None

	def load(self) -> str:
		"""
		加载模板文件内容

		Returns:
			模板文件的文本内容

		Raises:
			FileNotFoundError: 模板文件不存在
			ValueError: 模板文件为空
		"""
		if not self._config.template_path.exists():
			raise FileNotFoundError(f'Template file not found: {self._config.template_path}')

		content = self._config.template_path.read_text(encoding='utf-8')
		if not content.strip():
			raise ValueError(f'Template file is empty: {self._config.template_path}')

		self._template_content = content
		return content

	def validate(self) -> list[str]:
		"""
		校验模板完整性

		Returns:
			缺失的占位符或字段列表，如果为空则表示校验通过

		Raises:
			ValueError: 模板未加载
		"""
		if self._template_content is None:
			raise ValueError('Template not loaded. Call load() first.')

		missing: list[str] = []

		# 检查必需的占位符
		for placeholder in self._config.required_placeholders:
			if placeholder not in self._template_content:
				missing.append(f'placeholder:{placeholder}')

		# 检查必需的输出字段指令
		for field_name in self._config.required_output_fields:
			if field_name not in self._template_content:
				missing.append(f'field:{field_name}')

		return missing

	def render(
		self, *, title: str, original_tags: list[str], extracted_text: str, channel_name: str
	) -> str:
		"""
		渲染模板，替换占位符

		Args:
			title: PPT 标题
			original_tags: 原始标签列表
			extracted_text: 提取的 PPT 文本内容
			channel_name: 频道名称

		Returns:
			渲染后的 Prompt 文本

		Raises:
			ValueError: 模板未加载
		"""
		if self._template_content is None:
			raise ValueError('Template not loaded. Call load() first.')

		# 格式化标签列表
		tags_str = ', '.join(original_tags) if original_tags else '无'

		# 替换占位符
		rendered = self._template_content
		rendered = rendered.replace('{title}', title)
		rendered = rendered.replace('{original_tags}', tags_str)
		rendered = rendered.replace('{extracted_text}', extracted_text)
		rendered = rendered.replace('{channel_name}', channel_name)

		return rendered
