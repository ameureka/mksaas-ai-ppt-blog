"""
AIEnrichmentService 单元测试
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from src.factory.ai.config_loader import AIEnrichmentConfig
from src.factory.ai.enrichment_service import (
	AIEnrichmentService,
	EnrichmentResult,
	EnrichmentServiceConfig,
	EtlOutput,
	create_etl_output,
)
from src.factory.ai.text_extractor import ExtractedText


@pytest.fixture
def mock_config(tmp_path: Path) -> AIEnrichmentConfig:
	"""创建测试配置"""
	return AIEnrichmentConfig(
		project_root=tmp_path,
		forbidden_keywords=['BAD', '第一PPT'],
		valid_categories={'business', 'education', 'general'},
		fallback_category='general',
		ai_command_template=['echo', '{prompt}', '{output}'],
		ai_timeout_seconds=5,
		ai_max_retries=1,
		ai_concurrency=1,
		prompt_template_path=None,
		ai_pending_dir=tmp_path / 'ai_tasks' / 'pending',
		ai_completed_dir=tmp_path / 'ai_tasks' / 'completed',
	)


@pytest.fixture
def mock_pptx(tmp_path: Path) -> Path:
	"""创建模拟 PPTX 文件"""
	pptx_path = tmp_path / 'test.pptx'
	# 创建一个最小的 PPTX 文件（实际上是空文件，测试时会 mock）
	pptx_path.write_bytes(b'')
	return pptx_path


@pytest.fixture
def mock_etl_output(mock_pptx: Path) -> EtlOutput:
	"""创建测试 EtlOutput"""
	return EtlOutput(
		aid='test-001',
		channel_id='ppt_moban',
		local_pptx_path=mock_pptx,
		meta={
			'title': '商务年终总结PPT模板',
			'tags': ['商务', '年终总结', 'PPT'],
		},
	)


class TestAIEnrichmentService:
	"""AIEnrichmentService 测试"""

	def test_init_with_config(self, mock_config: AIEnrichmentConfig) -> None:
		"""测试使用配置初始化"""
		service = AIEnrichmentService(ai_config=mock_config)

		assert service._config == mock_config

	@patch('src.factory.ai.enrichment_service.TextExtractor')
	def test_enrich_single_success(
		self,
		mock_text_extractor_class: MagicMock,
		mock_config: AIEnrichmentConfig,
		mock_etl_output: EtlOutput,
	) -> None:
		"""测试单个 Asset 处理成功"""
		# Mock TextExtractor
		mock_extractor = MagicMock()
		mock_extractor.extract.return_value = ExtractedText(
			full_text='这是一个商务PPT模板，适合年终总结使用。',
			slide_texts=['这是一个商务PPT模板', '适合年终总结使用'],
			char_count=50,
			chinese_ratio=0.8,
			english_ratio=0.1,
		)
		mock_text_extractor_class.return_value = mock_extractor

		service = AIEnrichmentService(ai_config=mock_config)

		result = service.enrich_single(mock_etl_output, skip_ai=True)

		assert result.success is True
		assert result.aid == 'test-001'
		assert result.output is not None
		assert result.output.ppthub_category == 'general'  # fallback
		assert result.output.language == '中文'

	@patch('src.factory.ai.enrichment_service.TextExtractor')
	def test_enrich_single_with_rule_match(
		self,
		mock_text_extractor_class: MagicMock,
		mock_config: AIEnrichmentConfig,
		mock_etl_output: EtlOutput,
	) -> None:
		"""测试规则匹配"""
		# Mock TextExtractor
		mock_extractor = MagicMock()
		mock_extractor.extract.return_value = ExtractedText(
			full_text='商务PPT',
			slide_texts=['商务PPT'],
			char_count=10,
			chinese_ratio=0.8,
			english_ratio=0.1,
		)
		mock_text_extractor_class.return_value = mock_extractor

		# Mock RuleEngine
		mock_rule_engine = MagicMock()
		mock_rule_engine.match.return_value = 'business'

		service = AIEnrichmentService(ai_config=mock_config)

		result = service.enrich_single(
			mock_etl_output,
			rule_engine=mock_rule_engine,
			skip_ai=True,
		)

		assert result.success is True
		assert result.rule_matched is True
		assert result.output is not None
		assert result.output.ppthub_category == 'business'
		assert result.output.category_source == 'rule'

	@patch('src.factory.ai.enrichment_service.TextExtractor')
	def test_enrich_single_error_handling(
		self,
		mock_text_extractor_class: MagicMock,
		mock_config: AIEnrichmentConfig,
		mock_etl_output: EtlOutput,
	) -> None:
		"""测试错误处理"""
		# Mock TextExtractor 抛出异常
		mock_extractor = MagicMock()
		mock_extractor.extract.side_effect = RuntimeError('Extract failed')
		mock_text_extractor_class.return_value = mock_extractor

		service = AIEnrichmentService(ai_config=mock_config)

		result = service.enrich_single(mock_etl_output, skip_ai=True)

		assert result.success is False
		assert result.error_code == 'ENRICHMENT_ERROR'
		assert 'Extract failed' in result.error_message

	@patch('src.factory.ai.enrichment_service.TextExtractor')
	def test_enrich_batch(
		self,
		mock_text_extractor_class: MagicMock,
		mock_config: AIEnrichmentConfig,
		tmp_path: Path,
	) -> None:
		"""测试批量处理"""
		# Mock TextExtractor
		mock_extractor = MagicMock()
		mock_extractor.extract.return_value = ExtractedText(
			full_text='测试内容',
			slide_texts=['测试内容'],
			char_count=10,
			chinese_ratio=0.8,
			english_ratio=0.1,
		)
		mock_text_extractor_class.return_value = mock_extractor

		# 创建多个 EtlOutput
		etl_outputs = []
		for i in range(3):
			pptx_path = tmp_path / f'test_{i}.pptx'
			pptx_path.write_bytes(b'')
			etl_outputs.append(EtlOutput(
				aid=f'test-{i:03d}',
				channel_id='ppt_moban',
				local_pptx_path=pptx_path,
				meta={'title': f'测试模板{i}', 'tags': ['测试']},
			))

		service = AIEnrichmentService(ai_config=mock_config)

		report = service.enrich_batch(
			batch_id='test-batch',
			etl_outputs=etl_outputs,
			skip_ai=True,
		)

		assert report.total == 3
		assert report.success == 3
		assert report.failed == 0

	@patch('src.factory.ai.enrichment_service.TextExtractor')
	def test_enrich_batch_with_failures(
		self,
		mock_text_extractor_class: MagicMock,
		mock_config: AIEnrichmentConfig,
		tmp_path: Path,
	) -> None:
		"""测试批量处理包含失败"""
		# Mock TextExtractor - 第二个调用失败
		mock_extractor = MagicMock()
		call_count = {'count': 0}

		def extract_side_effect(path: Path) -> ExtractedText:
			call_count['count'] += 1
			if call_count['count'] == 2:
				raise RuntimeError('Extract failed')
			return ExtractedText(
				full_text='测试内容',
				slide_texts=['测试内容'],
				char_count=10,
				chinese_ratio=0.8,
				english_ratio=0.1,
			)

		mock_extractor.extract.side_effect = extract_side_effect
		mock_text_extractor_class.return_value = mock_extractor

		# 创建多个 EtlOutput
		etl_outputs = []
		for i in range(3):
			pptx_path = tmp_path / f'test_{i}.pptx'
			pptx_path.write_bytes(b'')
			etl_outputs.append(EtlOutput(
				aid=f'test-{i:03d}',
				channel_id='ppt_moban',
				local_pptx_path=pptx_path,
				meta={'title': f'测试模板{i}', 'tags': ['测试']},
			))

		service = AIEnrichmentService(ai_config=mock_config)

		report = service.enrich_batch(
			batch_id='test-batch',
			etl_outputs=etl_outputs,
			skip_ai=True,
		)

		assert report.total == 3
		assert report.success == 2
		assert report.failed == 1


class TestCreateEtlOutput:
	"""create_etl_output 便捷函数测试"""

	def test_create_etl_output(self, tmp_path: Path) -> None:
		"""测试创建 EtlOutput"""
		pptx_path = tmp_path / 'test.pptx'
		pptx_path.write_bytes(b'')

		etl = create_etl_output(
			aid='test-001',
			channel_id='ppt_moban',
			local_pptx_path=pptx_path,
			meta={'title': '测试', 'tags': ['tag1']},
		)

		assert etl.aid == 'test-001'
		assert etl.channel_id == 'ppt_moban'
		assert etl.local_pptx_path == pptx_path
		assert etl.meta == {'title': '测试', 'tags': ['tag1']}

	def test_create_etl_output_string_path(self, tmp_path: Path) -> None:
		"""测试使用字符串路径"""
		pptx_path = tmp_path / 'test.pptx'
		pptx_path.write_bytes(b'')

		etl = create_etl_output(
			aid='test-001',
			channel_id='ppt_moban',
			local_pptx_path=str(pptx_path),
		)

		assert isinstance(etl.local_pptx_path, Path)

	def test_create_etl_output_default_meta(self, tmp_path: Path) -> None:
		"""测试默认 meta"""
		pptx_path = tmp_path / 'test.pptx'
		pptx_path.write_bytes(b'')

		etl = create_etl_output(
			aid='test-001',
			channel_id='ppt_moban',
			local_pptx_path=pptx_path,
		)

		assert etl.meta == {}


class TestEnrichmentResult:
	"""EnrichmentResult 测试"""

	def test_success_result(self) -> None:
		"""测试成功结果"""
		result = EnrichmentResult(
			aid='test-001',
			success=True,
			rule_matched=True,
			ai_called=False,
		)

		assert result.success is True
		assert result.error_code is None

	def test_failed_result(self) -> None:
		"""测试失败结果"""
		result = EnrichmentResult(
			aid='test-001',
			success=False,
			error_code='TEST_ERROR',
			error_message='Test error',
		)

		assert result.success is False
		assert result.error_code == 'TEST_ERROR'


class TestEnrichmentServiceConfig:
	"""EnrichmentServiceConfig 测试"""

	def test_default_config(self) -> None:
		"""测试默认配置"""
		config = EnrichmentServiceConfig()

		assert config.ai_timeout_seconds == 60
		assert config.ai_max_retries == 2
		assert config.max_concurrency == 1
		assert config.description_min_length == 50
		assert config.tags_min_count == 3

	def test_custom_config(self) -> None:
		"""测试自定义配置"""
		config = EnrichmentServiceConfig(
			ai_timeout_seconds=120,
			max_concurrency=4,
			tags_max_count=10,
		)

		assert config.ai_timeout_seconds == 120
		assert config.max_concurrency == 4
		assert config.tags_max_count == 10
