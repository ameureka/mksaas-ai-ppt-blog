"""
DescriptionBuilder 模块单元测试
"""

import pytest

from factory.ai.description_builder import DescriptionBuilder


def test_build_with_valid_summary() -> None:
	"""测试使用有效的 AI 摘要（长度 >= min_length 时不追加 structure_features）"""
	builder = DescriptionBuilder(forbidden_keywords=[], min_length=20)
	result = builder.build(
		ai_summary='这是一个详细的AI生成的摘要内容，描述了模板的风格和特点，包含足够的信息。',
		title='测试标题',
		ai_scenario='测试场景',
		ai_structure_features='结构特点',
	)

	assert result.source == 'ai_summary'
	assert '这是一个详细的' in result.description
	assert result.final_length > 0


def test_build_with_short_summary() -> None:
	"""测试摘要过短时使用 title + scenario"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='太短',  # 少于 20 字
		title='测试标题',
		ai_scenario='适合商务演示使用',
		ai_structure_features='包含封面、目录、正文',
	)

	assert result.source in ['title_scenario', 'title_scenario_structure']
	assert '测试标题' in result.description
	assert '适合商务演示使用' in result.description


def test_build_with_empty_summary() -> None:
	"""测试空摘要"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='',
		title='测试标题',
		ai_scenario='测试场景',
		ai_structure_features='结构特点',
	)

	assert result.source in ['title_scenario', 'title_scenario_structure']
	assert '测试标题' in result.description


def test_build_append_structure_features() -> None:
	"""测试追加结构特点"""
	builder = DescriptionBuilder(forbidden_keywords=[], min_length=50)
	result = builder.build(
		ai_summary='',
		title='短标题',
		ai_scenario='短场景',
		ai_structure_features='这是一个详细的结构特点描述，包含多个章节和内容',
	)

	assert result.source == 'title_scenario_structure'
	assert '结构特点' in result.description or '结构' in result.description
	assert len(result.description) >= 30  # 应该追加了内容


def test_build_truncate_long_description() -> None:
	"""测试截断过长的描述"""
	builder = DescriptionBuilder(forbidden_keywords=[], max_length=100)
	long_summary = '这是一个非常长的摘要' * 50  # 超过 100 字
	result = builder.build(
		ai_summary=long_summary,
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)

	assert len(result.description) <= 100
	assert result.final_length <= 100
	assert result.original_length > 100


def test_build_filter_forbidden_keywords() -> None:
	"""测试过滤敏感词"""
	builder = DescriptionBuilder(forbidden_keywords=['第一PPT', '1ppt'])
	result = builder.build(
		ai_summary='这是一个来自第一PPT的模板，可以在1ppt下载。',
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)

	assert '第一PPT' not in result.description
	assert '1ppt' not in result.description
	assert '这是一个来自' in result.description


def test_build_empty_inputs() -> None:
	"""测试所有输入为空"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='',
		title='',
		ai_scenario='',
		ai_structure_features='',
	)

	assert result.description == ''
	assert result.final_length == 0


def test_build_only_title() -> None:
	"""测试只有标题"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='',
		title='这是一个测试标题',
		ai_scenario='',
		ai_structure_features='',
	)

	assert '这是一个测试标题' in result.description
	assert result.source in ['title_scenario', 'title_scenario_structure']


def test_build_only_structure() -> None:
	"""测试只有结构特点"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='',
		title='',
		ai_scenario='',
		ai_structure_features='包含完整的结构特点描述',
	)

	assert '包含完整的结构特点描述' in result.description
	assert result.source == 'title_scenario_structure'


def test_build_min_length_threshold() -> None:
	"""测试最小长度阈值"""
	builder = DescriptionBuilder(forbidden_keywords=[], min_length=50)
	result = builder.build(
		ai_summary='',
		title='短',
		ai_scenario='短',
		ai_structure_features='这是一个足够长的结构特点描述，用于补充长度',
	)

	# 应该追加了 structure_features
	assert '结构特点' in result.description or '结构' in result.description


def test_build_max_length_threshold() -> None:
	"""测试最大长度阈值"""
	builder = DescriptionBuilder(forbidden_keywords=[], max_length=50)
	result = builder.build(
		ai_summary='这是一个非常长的摘要内容' * 10,
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)

	assert len(result.description) <= 50


def test_build_whitespace_handling() -> None:
	"""测试空格处理"""
	builder = DescriptionBuilder(forbidden_keywords=[])
	result = builder.build(
		ai_summary='  这是一个带空格的摘要  ',
		title='  标题  ',
		ai_scenario='  场景  ',
		ai_structure_features='  结构  ',
	)

	assert result.description.strip() == result.description
	assert '  ' not in result.description or result.description.count('  ') <= 1


def test_build_source_tracking() -> None:
	"""测试来源追踪"""
	# 测试 ai_summary 来源（设置 min_length=20 避免追加 structure_features）
	builder1 = DescriptionBuilder(forbidden_keywords=[], min_length=20)
	result1 = builder1.build(
		ai_summary='这是一个足够长的摘要内容，包含详细的描述信息。',
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)
	assert result1.source == 'ai_summary'

	# 测试 title_scenario 来源
	builder2 = DescriptionBuilder(forbidden_keywords=[])
	result2 = builder2.build(
		ai_summary='短',
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)
	assert result2.source in ['title_scenario', 'title_scenario_structure']


def test_build_length_tracking() -> None:
	"""测试长度追踪"""
	# 设置 min_length=20 确保使用 ai_summary 且不追加 structure_features
	builder = DescriptionBuilder(forbidden_keywords=['敏感词'], min_length=20)
	result = builder.build(
		ai_summary='这是一个包含敏感词的摘要内容，用于测试长度追踪功能。',
		title='标题',
		ai_scenario='场景',
		ai_structure_features='结构',
	)

	assert result.original_length > 0
	assert result.final_length > 0
	# 过滤敏感词后长度应该减少
	assert result.final_length < result.original_length


def test_filter_forbidden() -> None:
	"""测试敏感词过滤"""
	builder = DescriptionBuilder(forbidden_keywords=['第一PPT', '1ppt', 'www.1ppt.com'])

	text = '这是来自第一PPT的模板，可以在1ppt和www.1ppt.com下载。'
	filtered = builder._filter_forbidden(text)

	assert '第一PPT' not in filtered
	assert '1ppt' not in filtered
	assert 'www.1ppt.com' not in filtered
	assert '这是来自' in filtered
	assert '的模板' in filtered
