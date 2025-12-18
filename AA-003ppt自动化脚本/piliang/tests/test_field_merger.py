"""
FieldMerger 单元测试
"""

from __future__ import annotations

import json
import sqlite3
from typing import Literal

import pytest

from factory.ai.ai_parser import ParsedAiMeta
from factory.ai.description_builder import BuiltDescription
from factory.ai.field_merger import (
	AiEnrichmentOutput,
	FieldMerger,
	FieldMergerConfig,
	MergeInput,
	create_merge_input,
)
from factory.ai.language_detector import LanguageDetectionResult
from factory.ai.tags_normalizer import NormalizedTags


def _make_ai_meta(
	*,
	ai_summary: str = '测试摘要',
	ai_content_summary: str = '详细的SEO优化描述，包含更多内容用于搜索引擎优化',
	ai_keywords: list[str] | None = None,
	ai_scenario: str = '测试场景',
	ai_color_scheme: str = '蓝色',
	ai_structure_features: str = '结构特点',
	ai_template_features: str = '模板特点',
	ppthub_category: str = 'business',
	language: Literal['中文', 'English', '其他'] = '中文',
	warnings: list[str] | None = None,
) -> ParsedAiMeta:
	"""创建测试用 ParsedAiMeta"""
	return ParsedAiMeta(
		ai_summary=ai_summary,
		ai_content_summary=ai_content_summary,
		ai_keywords=ai_keywords or ['关键词1', '关键词2'],
		ai_scenario=ai_scenario,
		ai_color_scheme=ai_color_scheme,
		ai_structure_features=ai_structure_features,
		ai_template_features=ai_template_features,
		ppthub_category=ppthub_category,
		language=language,
		warnings=warnings or [],
	)


def _make_language_detection(
	*,
	code: Literal['zh', 'en', 'other'] = 'zh',
	display: Literal['中文', 'English', '其他'] = '中文',
	source: Literal['rule', 'ai', 'fallback'] = 'rule',
) -> LanguageDetectionResult:
	"""创建测试用 LanguageDetectionResult"""
	return LanguageDetectionResult(
		code=code,
		display=display,
		chinese_ratio=0.8,
		english_ratio=0.1,
		source=source,
	)


def _make_normalized_tags(
	*,
	tags: list[str] | None = None,
) -> NormalizedTags:
	"""创建测试用 NormalizedTags"""
	return NormalizedTags(
		tags=tags or ['标签1', '标签2', '标签3'],
		source_ai_count=2,
		source_original_count=3,
		source_title_count=0,
		filtered_count=1,
	)


def _make_built_description(
	*,
	description: str = '这是一个测试描述',
	source: Literal['ai_summary', 'title_scenario', 'title_scenario_structure'] = 'ai_summary',
) -> BuiltDescription:
	"""创建测试用 BuiltDescription"""
	return BuiltDescription(
		description=description,
		source=source,
		original_length=len(description),
		final_length=len(description),
	)


class TestFieldMerger:
	"""FieldMerger 测试"""

	def test_merge_with_rule_category(self) -> None:
		"""测试规则优先：使用规则分类"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(ppthub_category='education'),
			rule_category='business',  # 规则分类
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'business'  # 使用规则分类
		assert output.category_source == 'rule'
		assert output.ai_fallback_reason is None

	def test_merge_with_ai_category_when_rule_miss(self) -> None:
		"""测试规则未命中时使用 AI 分类"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(ppthub_category='education'),
			rule_category=None,  # 规则未命中
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'education'  # 使用 AI 分类
		assert output.category_source == 'ai'
		assert output.ai_fallback_reason == 'rule_miss'

	def test_merge_fallback_when_ai_invalid_category(self) -> None:
		"""测试 AI 分类无效时回退到 fallback"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(ppthub_category='invalid_category'),
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'general'  # 回退到 fallback
		assert output.category_source == 'fallback'
		assert output.ai_fallback_reason == 'ai_invalid_fallback_general'

	def test_merge_fallback_when_ai_call_failed(self) -> None:
		"""测试 AI 调用失败时回退到 fallback"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=None,
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
			ai_call_failed=True,
			ai_error_message='timeout',
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'general'
		assert output.category_source == 'fallback'
		assert output.ai_fallback_reason == 'ai_call_failed'
		assert any('AI call failed' in w for w in output.warnings)

	def test_merge_language_from_detection(self) -> None:
		"""测试语言来自检测结果"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(language='English'),
			rule_category='business',
			language_detection=_make_language_detection(display='中文', source='rule'),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.language == '中文'  # 使用检测结果
		assert output.language_source == 'rule'

	def test_merge_language_fallback_when_invalid(self) -> None:
		"""测试语言无效时回退"""
		merger = FieldMerger()
		# 创建一个无效语言的检测结果
		invalid_detection = LanguageDetectionResult(
			code='other',  # type: ignore
			display='French',  # type: ignore
			chinese_ratio=0.0,
			english_ratio=0.0,
			source='ai',
		)
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=invalid_detection,
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.language == '其他'  # 回退到 fallback
		assert output.language_source == 'fallback'
		assert any('invalid language' in w for w in output.warnings)

	def test_merge_tags_from_normalized(self) -> None:
		"""测试标签来自标准化结果"""
		merger = FieldMerger()
		tags = ['PPT模板', '商务', '年终总结']
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(tags=tags),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.tags_final == tags

	def test_merge_description_from_built(self) -> None:
		"""测试描述来自构建结果"""
		merger = FieldMerger()
		description = '这是一个精美的商务PPT模板'
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(description=description),
		)

		output = merger.merge(input_data)

		assert output.description_final == description

	def test_merge_ai_meta_fields(self) -> None:
		"""测试 AI Meta 字段正确传递"""
		merger = FieldMerger()
		ai_meta = _make_ai_meta(
			ai_summary='测试摘要内容',
			ai_keywords=['关键词A', '关键词B'],
			ai_scenario='商务演示',
			ai_color_scheme='蓝白配色',
			ai_structure_features='包含封面和目录',
			ai_template_features='全矢量可编辑',
		)
		input_data = MergeInput(
			aid='test-001',
			ai_meta=ai_meta,
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ai_summary == '测试摘要内容'
		assert output.ai_keywords == ['关键词A', '关键词B']
		assert output.ai_scenario == '商务演示'
		assert output.ai_color_scheme == '蓝白配色'
		assert output.ai_structure_features == '包含封面和目录'
		assert output.ai_template_features == '全矢量可编辑'

	def test_merge_empty_ai_meta_when_none(self) -> None:
		"""测试 AI Meta 为 None 时使用空值"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test-001',
			ai_meta=None,
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ai_summary == ''
		assert output.ai_keywords == []
		assert output.ai_scenario == ''
		assert output.ai_color_scheme == ''
		assert output.ai_structure_features == ''
		assert output.ai_template_features == ''

	def test_merge_warnings_aggregated(self) -> None:
		"""测试警告信息聚合"""
		merger = FieldMerger()
		ai_meta = _make_ai_meta(warnings=['AI warning 1'])
		input_data = MergeInput(
			aid='test-001',
			ai_meta=ai_meta,
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert 'AI warning 1' in output.warnings

	def test_merge_aid_preserved(self) -> None:
		"""测试 aid 正确保留"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='unique-asset-id-123',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.aid == 'unique-asset-id-123'


class TestFieldMergerConfig:
	"""FieldMergerConfig 测试"""

	def test_custom_valid_categories(self) -> None:
		"""测试自定义有效分类"""
		config = FieldMergerConfig(valid_categories={'cat1', 'cat2'})
		merger = FieldMerger(config)
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(ppthub_category='cat1'),
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'cat1'
		assert output.category_source == 'ai'

	def test_custom_fallback_category(self) -> None:
		"""测试自定义 fallback 分类"""
		config = FieldMergerConfig(
			valid_categories={'cat1'},
			fallback_category='cat1',
		)
		merger = FieldMerger(config)
		input_data = MergeInput(
			aid='test-001',
			ai_meta=_make_ai_meta(ppthub_category='invalid'),
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert output.ppthub_category == 'cat1'


class TestFieldMergerPersist:
	"""FieldMerger 持久化测试"""

	@pytest.fixture
	def db_conn(self) -> sqlite3.Connection:
		"""创建测试数据库"""
		conn = sqlite3.connect(':memory:')
		conn.execute("""
			CREATE TABLE processed_assets (
				aid TEXT PRIMARY KEY,
				source_batch_id TEXT,
				ai_summary TEXT,
				ai_keywords TEXT,
				ai_scenario TEXT,
				ai_color_scheme TEXT,
				ai_structure_features TEXT,
				ai_template_features TEXT,
				ppthub_category TEXT,
				language TEXT,
				tags_final TEXT,
				description_final TEXT,
				language_source TEXT,
				category_source TEXT,
				ai_fallback_reason TEXT
			)
		""")
		conn.execute("""
			INSERT INTO processed_assets (aid, source_batch_id)
			VALUES ('test-001', 'batch-001')
		""")
		conn.commit()
		return conn

	def test_persist_updates_record(self, db_conn: sqlite3.Connection) -> None:
		"""测试持久化更新记录"""
		merger = FieldMerger()
		output = AiEnrichmentOutput(
			aid='test-001',
			ai_summary='测试摘要',
			ai_keywords=['关键词1', '关键词2'],
			ai_scenario='测试场景',
			ai_color_scheme='蓝色',
			ai_structure_features='结构特点',
			ai_template_features='模板特点',
			ppthub_category='business',
			language='中文',
			tags_final=['标签1', '标签2'],
			description_final='测试描述',
			language_source='rule',
			category_source='rule',
			ai_fallback_reason=None,
		)

		merger.persist(db_conn, source_batch_id='batch-001', output=output)

		cursor = db_conn.execute(
			'SELECT * FROM processed_assets WHERE aid = ?',
			('test-001',),
		)
		row = cursor.fetchone()

		assert row is not None
		# 验证字段值
		assert row[2] == '测试摘要'  # ai_summary
		assert json.loads(row[3]) == ['关键词1', '关键词2']  # ai_keywords
		assert row[8] == 'business'  # ppthub_category
		assert row[9] == '中文'  # language
		assert json.loads(row[10]) == ['标签1', '标签2']  # tags_final

	def test_persist_batch(self, db_conn: sqlite3.Connection) -> None:
		"""测试批量持久化"""
		# 添加更多测试记录
		db_conn.execute("""
			INSERT INTO processed_assets (aid, source_batch_id)
			VALUES ('test-002', 'batch-001')
		""")
		db_conn.commit()

		merger = FieldMerger()
		outputs = [
			AiEnrichmentOutput(
				aid='test-001',
				ai_summary='摘要1',
				ai_keywords=['kw1'],
				ai_scenario='场景1',
				ai_color_scheme='蓝色',
				ai_structure_features='结构1',
				ai_template_features='特点1',
				ppthub_category='business',
				language='中文',
				tags_final=['tag1'],
				description_final='描述1',
				language_source='rule',
				category_source='rule',
			),
			AiEnrichmentOutput(
				aid='test-002',
				ai_summary='摘要2',
				ai_keywords=['kw2'],
				ai_scenario='场景2',
				ai_color_scheme='红色',
				ai_structure_features='结构2',
				ai_template_features='特点2',
				ppthub_category='education',
				language='English',
				tags_final=['tag2'],
				description_final='描述2',
				language_source='ai',
				category_source='ai',
				ai_fallback_reason='rule_miss',
			),
		]

		updated = merger.persist_batch(db_conn, source_batch_id='batch-001', outputs=outputs)

		assert updated == 2

		# 验证两条记录都已更新
		cursor = db_conn.execute('SELECT aid, ai_summary FROM processed_assets ORDER BY aid')
		rows = cursor.fetchall()
		assert len(rows) == 2
		assert rows[0][1] == '摘要1'
		assert rows[1][1] == '摘要2'


class TestCreateMergeInput:
	"""create_merge_input 便捷函数测试"""

	def test_create_merge_input(self) -> None:
		"""测试创建 MergeInput"""
		ai_meta = _make_ai_meta()
		language_detection = _make_language_detection()
		normalized_tags = _make_normalized_tags()
		built_description = _make_built_description()

		input_data = create_merge_input(
			aid='test-001',
			ai_meta=ai_meta,
			rule_category='business',
			language_detection=language_detection,
			normalized_tags=normalized_tags,
			built_description=built_description,
		)

		assert isinstance(input_data, MergeInput)
		assert input_data.aid == 'test-001'
		assert input_data.rule_category == 'business'
		assert input_data.ai_call_failed is False


class TestFieldMergerPropertyBased:
	"""FieldMerger 属性测试"""

	def test_property_output_always_has_valid_category(self) -> None:
		"""属性: 输出始终有有效分类"""
		merger = FieldMerger()
		test_cases = [
			(None, None),  # 无规则无 AI
			('business', None),  # 有规则无 AI
			(None, _make_ai_meta(ppthub_category='education')),  # 无规则有 AI
			('business', _make_ai_meta(ppthub_category='education')),  # 有规则有 AI
			(None, _make_ai_meta(ppthub_category='invalid')),  # AI 无效分类
		]

		for rule_cat, ai_meta in test_cases:
			input_data = MergeInput(
				aid='test',
				ai_meta=ai_meta,
				rule_category=rule_cat,
				language_detection=_make_language_detection(),
				normalized_tags=_make_normalized_tags(),
				built_description=_make_built_description(),
			)
			output = merger.merge(input_data)

			assert output.ppthub_category in merger._config.valid_categories or output.ppthub_category == merger._config.fallback_category

	def test_property_output_always_has_valid_language(self) -> None:
		"""属性: 输出始终有有效语言"""
		merger = FieldMerger()
		languages = ['中文', 'English', '其他', 'invalid', '']

		for lang in languages:
			detection = LanguageDetectionResult(
				code='other',  # type: ignore
				display=lang,  # type: ignore
				chinese_ratio=0.5,
				english_ratio=0.5,
				source='rule',
			)
			input_data = MergeInput(
				aid='test',
				ai_meta=_make_ai_meta(),
				rule_category='business',
				language_detection=detection,
				normalized_tags=_make_normalized_tags(),
				built_description=_make_built_description(),
			)
			output = merger.merge(input_data)

			assert output.language in merger._config.valid_languages

	def test_property_category_source_matches_origin(self) -> None:
		"""属性: category_source 与来源匹配"""
		merger = FieldMerger()

		# 规则来源
		input1 = MergeInput(
			aid='test',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)
		output1 = merger.merge(input1)
		assert output1.category_source == 'rule'

		# AI 来源
		input2 = MergeInput(
			aid='test',
			ai_meta=_make_ai_meta(ppthub_category='education'),
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)
		output2 = merger.merge(input2)
		assert output2.category_source == 'ai'

		# Fallback 来源
		input3 = MergeInput(
			aid='test',
			ai_meta=None,
			rule_category=None,
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)
		output3 = merger.merge(input3)
		assert output3.category_source == 'fallback'

	def test_property_tags_final_is_list(self) -> None:
		"""属性: tags_final 始终是列表"""
		merger = FieldMerger()
		input_data = MergeInput(
			aid='test',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)

		output = merger.merge(input_data)

		assert isinstance(output.tags_final, list)

	def test_property_ai_keywords_is_list(self) -> None:
		"""属性: ai_keywords 始终是列表"""
		merger = FieldMerger()

		# 有 AI Meta
		input1 = MergeInput(
			aid='test',
			ai_meta=_make_ai_meta(),
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)
		output1 = merger.merge(input1)
		assert isinstance(output1.ai_keywords, list)

		# 无 AI Meta
		input2 = MergeInput(
			aid='test',
			ai_meta=None,
			rule_category='business',
			language_detection=_make_language_detection(),
			normalized_tags=_make_normalized_tags(),
			built_description=_make_built_description(),
		)
		output2 = merger.merge(input2)
		assert isinstance(output2.ai_keywords, list)
