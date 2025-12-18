"""
BatchProcessor 单元测试
"""

from __future__ import annotations

import time
from typing import Any

import pytest

from factory.ai.batch_processor import (
	AssetInput,
	AssetProcessResult,
	BatchProcessorConfig,
	BatchProcessReport,
	BatchProcessor,
	ProcessStatus,
	create_asset_input,
	create_failed_result,
	create_success_result,
)


def _success_processor(asset: AssetInput) -> AssetProcessResult:
	"""总是成功的处理器"""
	return create_success_result(asset.aid, output={'processed': True})


def _fail_processor(asset: AssetInput) -> AssetProcessResult:
	"""总是失败的处理器"""
	return create_failed_result(asset.aid, 'TEST_ERROR', 'Test error message')


def _exception_processor(asset: AssetInput) -> AssetProcessResult:
	"""总是抛异常的处理器"""
	raise RuntimeError('Test exception')


def _conditional_processor(asset: AssetInput) -> AssetProcessResult:
	"""条件处理器：aid 包含 'fail' 则失败"""
	if 'fail' in asset.aid:
		return create_failed_result(asset.aid, 'CONDITIONAL_FAIL', 'Conditional failure')
	return create_success_result(asset.aid)


def _slow_processor(asset: AssetInput) -> AssetProcessResult:
	"""慢处理器"""
	time.sleep(0.05)  # 50ms
	return create_success_result(asset.aid)


class TestBatchProcessor:
	"""BatchProcessor 测试"""

	def test_process_all_success(self) -> None:
		"""测试全部成功"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('asset-001', {}),
			create_asset_input('asset-002', {}),
			create_asset_input('asset-003', {}),
		]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_success_processor,
		)

		assert report.total == 3
		assert report.success == 3
		assert report.failed == 0
		assert report.skipped == 0
		assert report.success_rate == 1.0

	def test_process_all_failed(self) -> None:
		"""测试全部失败"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('asset-001', {}),
			create_asset_input('asset-002', {}),
		]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_fail_processor,
		)

		assert report.total == 2
		assert report.success == 0
		assert report.failed == 2
		assert report.skipped == 0
		assert report.success_rate == 0.0

	def test_process_mixed_results(self) -> None:
		"""测试混合结果"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('asset-001', {}),
			create_asset_input('fail-002', {}),
			create_asset_input('asset-003', {}),
			create_asset_input('fail-004', {}),
		]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_conditional_processor,
		)

		assert report.total == 4
		assert report.success == 2
		assert report.failed == 2
		assert report.failed_aids == ['fail-002', 'fail-004']

	def test_process_with_skipped(self) -> None:
		"""测试跳过的 Asset"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('asset-001', {}),
			create_asset_input('asset-002', {}, skip=True, skip_reason='Already processed'),
			create_asset_input('asset-003', {}),
		]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_success_processor,
		)

		assert report.total == 3
		assert report.success == 2
		assert report.failed == 0
		assert report.skipped == 1
		assert report.skipped_aids == ['asset-002']

	def test_process_empty_batch(self) -> None:
		"""测试空批次"""
		processor = BatchProcessor()

		report = processor.process(
			batch_id='empty-batch',
			assets=[],
			process_func=_success_processor,
		)

		assert report.total == 0
		assert report.success == 0
		assert report.failed == 0
		assert report.skipped == 0
		assert report.success_rate == 0.0

	def test_process_with_retry(self) -> None:
		"""测试重试机制"""
		call_count = {'count': 0}

		def retry_processor(asset: AssetInput) -> AssetProcessResult:
			call_count['count'] += 1
			if call_count['count'] < 3:
				raise RuntimeError('Temporary error')
			return create_success_result(asset.aid)

		config = BatchProcessorConfig(max_retries=3, retry_delay_ms=10)
		processor = BatchProcessor(config)
		assets = [create_asset_input('asset-001', {})]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=retry_processor,
		)

		assert report.success == 1
		assert call_count['count'] == 3

	def test_process_retry_exhausted(self) -> None:
		"""测试重试耗尽"""
		config = BatchProcessorConfig(max_retries=2, retry_delay_ms=10)
		processor = BatchProcessor(config)
		assets = [create_asset_input('asset-001', {})]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_exception_processor,
		)

		assert report.failed == 1
		assert report.results[0].error_code == 'MAX_RETRIES_EXCEEDED'
		assert report.results[0].retry_count == 2

	def test_process_concurrent(self) -> None:
		"""测试并发处理"""
		config = BatchProcessorConfig(max_concurrency=3)
		processor = BatchProcessor(config)
		assets = [
			create_asset_input(f'asset-{i:03d}', {})
			for i in range(6)
		]

		start_time = time.time()
		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_slow_processor,
		)
		duration = time.time() - start_time

		assert report.success == 6
		# 并发处理应该比串行快
		# 6 个任务，每个 50ms，3 并发应该约 100ms
		assert duration < 0.3  # 允许一些开销

	def test_process_serial(self) -> None:
		"""测试串行处理"""
		config = BatchProcessorConfig(max_concurrency=1)
		processor = BatchProcessor(config)
		assets = [
			create_asset_input(f'asset-{i:03d}', {})
			for i in range(3)
		]

		start_time = time.time()
		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_slow_processor,
		)
		duration = time.time() - start_time

		assert report.success == 3
		# 串行处理应该约 150ms
		assert duration >= 0.15

	def test_process_with_callback(self) -> None:
		"""测试带回调的处理"""
		progress_calls: list[tuple[int, int, str]] = []
		complete_called = {'called': False}

		def on_progress(current: int, total: int, result: AssetProcessResult) -> None:
			progress_calls.append((current, total, result.aid))

		def on_complete(report: BatchProcessReport) -> None:
			complete_called['called'] = True

		processor = BatchProcessor()
		assets = [
			create_asset_input('asset-001', {}),
			create_asset_input('asset-002', {}),
		]

		report = processor.process_with_callback(
			batch_id='test-batch',
			assets=assets,
			process_func=_success_processor,
			on_progress=on_progress,
			on_complete=on_complete,
		)

		assert len(progress_calls) == 2
		assert progress_calls[0] == (1, 2, 'asset-001')
		assert progress_calls[1] == (2, 2, 'asset-002')
		assert complete_called['called'] is True

	def test_report_duration(self) -> None:
		"""测试报告包含耗时"""
		processor = BatchProcessor()
		assets = [create_asset_input('asset-001', {})]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_slow_processor,
		)

		assert report.duration_ms >= 50

	def test_result_duration(self) -> None:
		"""测试单个结果包含耗时"""
		processor = BatchProcessor()
		assets = [create_asset_input('asset-001', {})]

		report = processor.process(
			batch_id='test-batch',
			assets=assets,
			process_func=_slow_processor,
		)

		assert report.results[0].duration_ms >= 50


class TestBatchProcessReport:
	"""BatchProcessReport 测试"""

	def test_to_dict(self) -> None:
		"""测试转换为字典"""
		report = BatchProcessReport(
			batch_id='test-batch',
			total=10,
			success=7,
			failed=2,
			skipped=1,
			duration_ms=1000,
			results=[
				AssetProcessResult(aid='fail-001', status=ProcessStatus.FAILED),
				AssetProcessResult(aid='skip-001', status=ProcessStatus.SKIPPED),
			],
		)

		d = report.to_dict()

		assert d['batch_id'] == 'test-batch'
		assert d['total'] == 10
		assert d['success'] == 7
		assert d['failed'] == 2
		assert d['skipped'] == 1
		assert d['success_rate'] == '70.00%'
		assert d['failed_aids'] == ['fail-001']
		assert d['skipped_aids'] == ['skip-001']

	def test_success_rate_zero_total(self) -> None:
		"""测试零总数时的成功率"""
		report = BatchProcessReport(
			batch_id='empty',
			total=0,
			success=0,
			failed=0,
			skipped=0,
			duration_ms=0,
		)

		assert report.success_rate == 0.0


class TestAssetInput:
	"""AssetInput 测试"""

	def test_create_asset_input(self) -> None:
		"""测试创建 AssetInput"""
		asset = create_asset_input('test-001', {'key': 'value'})

		assert asset.aid == 'test-001'
		assert asset.data == {'key': 'value'}
		assert asset.skip is False
		assert asset.skip_reason is None

	def test_create_asset_input_with_skip(self) -> None:
		"""测试创建跳过的 AssetInput"""
		asset = create_asset_input(
			'test-001',
			{},
			skip=True,
			skip_reason='Already processed',
		)

		assert asset.skip is True
		assert asset.skip_reason == 'Already processed'


class TestAssetProcessResult:
	"""AssetProcessResult 测试"""

	def test_create_success_result(self) -> None:
		"""测试创建成功结果"""
		result = create_success_result('test-001', output={'data': 'value'})

		assert result.aid == 'test-001'
		assert result.status == ProcessStatus.SUCCESS
		assert result.output == {'data': 'value'}
		assert result.error_code is None

	def test_create_failed_result(self) -> None:
		"""测试创建失败结果"""
		result = create_failed_result('test-001', 'ERROR_CODE', 'Error message')

		assert result.aid == 'test-001'
		assert result.status == ProcessStatus.FAILED
		assert result.error_code == 'ERROR_CODE'
		assert result.error_message == 'Error message'


class TestBatchProcessorConfig:
	"""BatchProcessorConfig 测试"""

	def test_default_config(self) -> None:
		"""测试默认配置"""
		config = BatchProcessorConfig()

		assert config.max_concurrency == 1
		assert config.max_retries == 2
		assert config.retry_delay_ms == 1000
		assert config.stop_on_critical_error is False

	def test_custom_config(self) -> None:
		"""测试自定义配置"""
		config = BatchProcessorConfig(
			max_concurrency=4,
			max_retries=5,
			retry_delay_ms=500,
			stop_on_critical_error=True,
		)

		assert config.max_concurrency == 4
		assert config.max_retries == 5
		assert config.retry_delay_ms == 500
		assert config.stop_on_critical_error is True


class TestBatchProcessorPropertyBased:
	"""BatchProcessor 属性测试"""

	def test_property_total_equals_sum(self) -> None:
		"""属性: total = success + failed + skipped"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('success-001', {}),
			create_asset_input('fail-001', {}),
			create_asset_input('skip-001', {}, skip=True),
			create_asset_input('success-002', {}),
			create_asset_input('fail-002', {}),
		]

		report = processor.process(
			batch_id='test',
			assets=assets,
			process_func=_conditional_processor,
		)

		assert report.total == report.success + report.failed + report.skipped

	def test_property_results_count_equals_total(self) -> None:
		"""属性: results 数量等于 total"""
		processor = BatchProcessor()
		assets = [
			create_asset_input(f'asset-{i}', {})
			for i in range(5)
		]

		report = processor.process(
			batch_id='test',
			assets=assets,
			process_func=_success_processor,
		)

		assert len(report.results) == report.total

	def test_property_success_rate_in_range(self) -> None:
		"""属性: 成功率在 0-1 之间"""
		processor = BatchProcessor()

		for n in range(5):
			assets = [
				create_asset_input(f'asset-{i}', {})
				for i in range(n)
			]

			report = processor.process(
				batch_id='test',
				assets=assets,
				process_func=_conditional_processor,
			)

			assert 0.0 <= report.success_rate <= 1.0

	def test_property_failed_aids_subset_of_results(self) -> None:
		"""属性: failed_aids 是 results 的子集"""
		processor = BatchProcessor()
		assets = [
			create_asset_input('success-001', {}),
			create_asset_input('fail-001', {}),
			create_asset_input('fail-002', {}),
		]

		report = processor.process(
			batch_id='test',
			assets=assets,
			process_func=_conditional_processor,
		)

		all_aids = {r.aid for r in report.results}
		for aid in report.failed_aids:
			assert aid in all_aids

	def test_property_duration_non_negative(self) -> None:
		"""属性: 耗时非负"""
		processor = BatchProcessor()
		assets = [create_asset_input('asset-001', {})]

		report = processor.process(
			batch_id='test',
			assets=assets,
			process_func=_success_processor,
		)

		assert report.duration_ms >= 0
		for result in report.results:
			assert result.duration_ms >= 0
