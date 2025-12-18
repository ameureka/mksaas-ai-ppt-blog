"""
TagsNormalizer 模块单元测试
"""

import pytest

from src.factory.ai.tags_normalizer import TagsNormalizer


def test_normalize_basic() -> None:
	"""测试基本标签标准化"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(
		ai_keywords=['关键词1', '关键词2', '关键词3'],
		original_tags=['标签1', '标签2'],
		title='测试标题',
	)

	assert len(result.tags) == 5
	assert '关键词1' in result.tags
	assert '标签1' in result.tags
	assert result.source_ai_count == 3
	assert result.source_original_count == 2


def test_normalize_deduplication() -> None:
	"""测试去重功能"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(
		ai_keywords=['关键词', '关键词', 'KEYWORD'],
		original_tags=['关键词', 'keyword'],
		title='测试',
	)

	# 应该只保留一个（不区分大小写）
	assert len([t for t in result.tags if t.lower() == '关键词']) == 1
	assert len([t for t in result.tags if t.lower() == 'keyword']) == 1


def test_normalize_trim_whitespace() -> None:
	"""测试去除空格"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(
		ai_keywords=['  关键词1  ', '关键词2'],
		original_tags=['标签1  ', '  标签2'],
		title='测试',
	)

	assert '关键词1' in result.tags
	assert '  关键词1  ' not in result.tags


def test_normalize_filter_length() -> None:
	"""测试过滤长度不符的标签"""
	normalizer = TagsNormalizer(forbidden_keywords=[], min_length=2, max_length=10)
	result = normalizer.normalize(
		ai_keywords=['a', '正常标签', '这是一个非常长的标签超过十个字'],
		original_tags=['b', '标签2'],
		title='测试',
	)

	assert 'a' not in result.tags  # 太短
	assert 'b' not in result.tags  # 太短
	assert '正常标签' in result.tags
	assert '这是一个非常长的标签超过十个字' not in result.tags  # 太长
	assert result.filtered_count >= 2


def test_normalize_filter_forbidden() -> None:
	"""测试过滤敏感词"""
	normalizer = TagsNormalizer(forbidden_keywords=['第一PPT', '1ppt'])
	result = normalizer.normalize(
		ai_keywords=['正常关键词', '第一PPT模板', '优质内容'],
		original_tags=['标签1', '1ppt下载'],
		title='测试',
	)

	assert '正常关键词' in result.tags
	assert '优质内容' in result.tags
	assert '第一PPT模板' not in result.tags
	assert '1ppt下载' not in result.tags
	assert result.filtered_count >= 2


def test_normalize_max_count() -> None:
	"""测试最大数量限制"""
	normalizer = TagsNormalizer(forbidden_keywords=[], max_count=8)
	result = normalizer.normalize(
		ai_keywords=['ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6', 'ai7'],
		original_tags=['tag1', 'tag2', 'tag3', 'tag4'],
		title='测试',
	)

	assert len(result.tags) <= 8
	# 应该优先保留 AI 关键词的前 5 个
	assert 'ai1' in result.tags
	assert 'ai2' in result.tags
	assert 'ai3' in result.tags
	assert 'ai4' in result.tags
	assert 'ai5' in result.tags


def test_normalize_min_count_supplement() -> None:
	"""测试最小数量补充"""
	normalizer = TagsNormalizer(forbidden_keywords=[], min_count=3)
	result = normalizer.normalize(
		ai_keywords=['关键词1'],
		original_tags=['标签1'],
		title='测试标题 包含 关键词',
	)

	assert len(result.tags) >= 3
	assert result.source_title_count > 0


def test_normalize_empty_inputs() -> None:
	"""测试空输入"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(ai_keywords=[], original_tags=[], title='测试标题 包含 关键词')

	# 应该从标题补充
	assert len(result.tags) >= 3
	assert result.source_title_count > 0


def test_extract_keywords_from_title() -> None:
	"""测试从标题提取关键词"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	keywords = normalizer._extract_keywords_from_title('这是一个测试标题，包含多个关键词')

	# 标点分割后应该得到完整的词组
	assert '这是一个测试标题' in keywords or '测试标题' in keywords or '测试' in keywords
	assert '包含多个关键词' in keywords or '关键词' in keywords
	assert len(keywords) > 0


def test_extract_keywords_filter_numbers() -> None:
	"""测试过滤纯数字"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	keywords = normalizer._extract_keywords_from_title('标题123 测试 456')

	assert '123' not in keywords
	assert '456' not in keywords
	assert '测试' in keywords


def test_extract_keywords_filter_short() -> None:
	"""测试过滤短词"""
	normalizer = TagsNormalizer(forbidden_keywords=[], min_length=2)
	keywords = normalizer._extract_keywords_from_title('a 测试 b 标题')

	assert 'a' not in keywords
	assert 'b' not in keywords
	assert '测试' in keywords
	assert '标题' in keywords


def test_extract_keywords_split_punctuation() -> None:
	"""测试按标点分割"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	keywords = normalizer._extract_keywords_from_title('关键词1-关键词2_关键词3，关键词4。关键词5')

	assert '关键词1' in keywords
	assert '关键词2' in keywords
	assert '关键词3' in keywords
	assert '关键词4' in keywords
	assert '关键词5' in keywords


def test_normalize_preserve_case() -> None:
	"""测试保留首次出现的大小写"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(
		ai_keywords=['PPT', 'Template'],
		original_tags=['ppt', 'template'],
		title='测试',
	)

	# 应该保留首次出现的大小写（AI 关键词优先）
	assert 'PPT' in result.tags or 'ppt' in result.tags
	assert 'Template' in result.tags or 'template' in result.tags
	# 但不应该同时出现两种大小写
	assert len([t for t in result.tags if t.lower() == 'ppt']) == 1
	assert len([t for t in result.tags if t.lower() == 'template']) == 1


def test_normalize_empty_strings() -> None:
	"""测试空字符串过滤"""
	normalizer = TagsNormalizer(forbidden_keywords=[])
	result = normalizer.normalize(
		ai_keywords=['', '  ', '关键词'],
		original_tags=['', '标签'],
		title='测试',
	)

	assert '' not in result.tags
	assert '  ' not in result.tags
	assert '关键词' in result.tags
	assert '标签' in result.tags


def test_contains_forbidden() -> None:
	"""测试敏感词检测"""
	normalizer = TagsNormalizer(forbidden_keywords=['第一PPT', '1ppt'])

	assert normalizer._contains_forbidden('第一PPT模板') is True
	assert normalizer._contains_forbidden('1ppt下载') is True
	assert normalizer._contains_forbidden('正常内容') is False


def test_normalize_ai_priority() -> None:
	"""测试 AI 关键词优先级"""
	normalizer = TagsNormalizer(forbidden_keywords=[], max_count=6)
	result = normalizer.normalize(
		ai_keywords=['ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'ai6'],
		original_tags=['tag1', 'tag2', 'tag3'],
		title='测试',
	)

	# 当超过最大数量时，应该优先保留 AI 关键词
	ai_count = sum(1 for tag in result.tags if tag.startswith('ai'))
	assert ai_count >= 5  # 至少保留前 5 个 AI 关键词
