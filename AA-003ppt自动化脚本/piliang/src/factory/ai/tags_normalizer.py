"""
TagsNormalizer 模块
负责合并、去重和收敛标签
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizedTags:
	"""标准化后的标签结果"""

	tags: list[str]
	source_ai_count: int
	source_original_count: int
	source_title_count: int
	filtered_count: int


class TagsNormalizer:
	"""标签标准化器"""

	def __init__(
		self,
		*,
		forbidden_keywords: list[str],
		min_count: int = 3,
		max_count: int = 8,
		min_length: int = 2,
		max_length: int = 20,
	) -> None:
		"""
		初始化标签标准化器

		Args:
			forbidden_keywords: 敏感词列表
			min_count: 最小标签数量
			max_count: 最大标签数量
			min_length: 单个标签最小长度
			max_length: 单个标签最大长度
		"""
		self._forbidden = [kw for kw in forbidden_keywords if kw]
		self._min_count = min_count
		self._max_count = max_count
		self._min_length = min_length
		self._max_length = max_length

	def normalize(
		self, *, ai_keywords: list[str], original_tags: list[str], title: str
	) -> NormalizedTags:
		"""
		标准化标签

		收敛策略：
		1. 合并 ai_keywords + original_tags
		2. trim + 小写去重（保留原始大小写）
		3. 过滤长度 < 2 或 > 20 的 tag
		4. 过滤包含敏感词的 tag
		5. 若 > 8 个：保留 ai_keywords 前 5 个 + original_tags 补充至 8 个
		6. 若 < 3 个：从 title 提取关键词补充

		Args:
			ai_keywords: AI 生成的关键词列表
			original_tags: 原始标签列表
			title: 标题（用于补充关键词）

		Returns:
			NormalizedTags 对象
		"""
		source_ai_count = len(ai_keywords)
		source_original_count = len(original_tags)

		# 步骤 1: 合并标签
		all_tags = list(ai_keywords) + list(original_tags)

		# 步骤 2: trim + 去重（保留首次出现的原始大小写）
		seen_lower: set[str] = set()
		unique_tags: list[str] = []
		for tag in all_tags:
			tag_stripped = tag.strip()
			if not tag_stripped:
				continue
			tag_lower = tag_stripped.lower()
			if tag_lower in seen_lower:
				continue
			seen_lower.add(tag_lower)
			unique_tags.append(tag_stripped)

		# 步骤 3 & 4: 过滤长度和敏感词
		filtered_tags: list[str] = []
		filtered_count = 0
		for tag in unique_tags:
			# 检查长度
			if len(tag) < self._min_length or len(tag) > self._max_length:
				filtered_count += 1
				continue
			# 检查敏感词
			if self._contains_forbidden(tag):
				filtered_count += 1
				continue
			filtered_tags.append(tag)

		# 步骤 5: 收敛到最大数量
		if len(filtered_tags) > self._max_count:
			# 保留 ai_keywords 前 5 个 + original_tags 补充至 8 个
			ai_tags_kept = [
				tag for tag in filtered_tags if tag in ai_keywords
			][: min(5, self._max_count)]
			original_tags_kept = [
				tag for tag in filtered_tags if tag in original_tags and tag not in ai_tags_kept
			][: self._max_count - len(ai_tags_kept)]
			filtered_tags = ai_tags_kept + original_tags_kept

		# 步骤 6: 补充到最小数量
		source_title_count = 0
		if len(filtered_tags) < self._min_count:
			title_keywords = self._extract_keywords_from_title(title)
			for keyword in title_keywords:
				if len(filtered_tags) >= self._min_count:
					break
				keyword_lower = keyword.lower()
				if keyword_lower not in seen_lower:
					filtered_tags.append(keyword)
					seen_lower.add(keyword_lower)
					source_title_count += 1

		return NormalizedTags(
			tags=filtered_tags,
			source_ai_count=source_ai_count,
			source_original_count=source_original_count,
			source_title_count=source_title_count,
			filtered_count=filtered_count,
		)

	def _contains_forbidden(self, text: str) -> bool:
		"""检查文本是否包含敏感词"""
		for keyword in self._forbidden:
			if keyword and keyword in text:
				return True
		return False

	def _extract_keywords_from_title(self, title: str) -> list[str]:
		"""
		从标题中提取关键词

		简单策略：
		1. 按空格、标点分割
		2. 过滤长度 < 2 的词
		3. 过滤纯数字
		4. 过滤敏感词

		Args:
			title: 标题文本

		Returns:
			关键词列表
		"""
		if not title:
			return []

		# 按空格和常见标点分割
		words = re.split(r'[\s\-_,，、。！？：；]+', title)

		keywords: list[str] = []
		for word in words:
			word_stripped = word.strip()
			if not word_stripped:
				continue
			# 过滤长度
			if len(word_stripped) < self._min_length or len(word_stripped) > self._max_length:
				continue
			# 过滤纯数字
			if word_stripped.isdigit():
				continue
			# 过滤敏感词
			if self._contains_forbidden(word_stripped):
				continue
			keywords.append(word_stripped)

		return keywords
