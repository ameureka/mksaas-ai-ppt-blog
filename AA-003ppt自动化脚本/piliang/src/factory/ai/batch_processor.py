"""
BatchProcessor 模块
负责批量处理 AI Enrichment 任务，支持错误隔离和并发控制
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger(__name__)


class ProcessStatus(Enum):
	"""处理状态"""

	SUCCESS = 'success'
	FAILED = 'failed'
	SKIPPED = 'skipped'


@dataclass(frozen=True)
class AssetProcessResult:
	"""单个 Asset 处理结果"""

	aid: str
	status: ProcessStatus
	error_code: str | None = None
	error_message: str | None = None
	retry_count: int = 0
	duration_ms: int = 0
	output: Any = None


@dataclass(frozen=True)
class BatchProcessReport:
	"""批量处理报告"""

	batch_id: str
	total: int
	success: int
	failed: int
	skipped: int
	duration_ms: int
	results: list[AssetProcessResult] = field(default_factory=list)

	@property
	def success_rate(self) -> float:
		"""成功率"""
		if self.total == 0:
			return 0.0
		return self.success / self.total

	@property
	def failed_aids(self) -> list[str]:
		"""失败的 Asset ID 列表"""
		return [r.aid for r in self.results if r.status == ProcessStatus.FAILED]

	@property
	def skipped_aids(self) -> list[str]:
		"""跳过的 Asset ID 列表"""
		return [r.aid for r in self.results if r.status == ProcessStatus.SKIPPED]

	def to_dict(self) -> dict[str, Any]:
		"""转换为字典"""
		return {
			'batch_id': self.batch_id,
			'total': self.total,
			'success': self.success,
			'failed': self.failed,
			'skipped': self.skipped,
			'duration_ms': self.duration_ms,
			'success_rate': f'{self.success_rate:.2%}',
			'failed_aids': self.failed_aids,
			'skipped_aids': self.skipped_aids,
		}


@dataclass(frozen=True)
class BatchProcessorConfig:
	"""批量处理器配置"""

	max_concurrency: int = 1
	max_retries: int = 2
	retry_delay_ms: int = 1000
	stop_on_critical_error: bool = False


@dataclass
class AssetInput:
	"""Asset 输入"""

	aid: str
	data: Any
	skip: bool = False
	skip_reason: str | None = None


# 处理函数类型
ProcessFunc = Callable[[AssetInput], AssetProcessResult]


class BatchProcessor:
	"""批量处理器"""

	def __init__(self, config: BatchProcessorConfig | None = None) -> None:
		"""
		初始化批量处理器

		Args:
			config: 处理器配置
		"""
		self._config = config or BatchProcessorConfig()

	def process(
		self,
		*,
		batch_id: str,
		assets: list[AssetInput],
		process_func: ProcessFunc,
	) -> BatchProcessReport:
		"""
		批量处理 Assets

		Args:
			batch_id: 批次 ID
			assets: Asset 输入列表
			process_func: 处理函数

		Returns:
			BatchProcessReport 对象
		"""
		start_time = time.time()
		results: list[AssetProcessResult] = []

		total = len(assets)
		success = 0
		failed = 0
		skipped = 0

		if self._config.max_concurrency <= 1:
			# 串行处理
			for asset in assets:
				result = self._process_single(asset, process_func)
				results.append(result)

				if result.status == ProcessStatus.SUCCESS:
					success += 1
				elif result.status == ProcessStatus.FAILED:
					failed += 1
					if self._config.stop_on_critical_error:
						logger.warning(f'Stopping batch due to critical error: {result.error_message}')
						break
				else:
					skipped += 1
		else:
			# 并行处理
			with ThreadPoolExecutor(max_workers=self._config.max_concurrency) as executor:
				futures = {
					executor.submit(self._process_single, asset, process_func): asset
					for asset in assets
				}

				for future in as_completed(futures):
					try:
						result = future.result()
						results.append(result)

						if result.status == ProcessStatus.SUCCESS:
							success += 1
						elif result.status == ProcessStatus.FAILED:
							failed += 1
						else:
							skipped += 1
					except Exception as e:
						asset = futures[future]
						logger.error(f'Unexpected error processing {asset.aid}: {e}')
						results.append(AssetProcessResult(
							aid=asset.aid,
							status=ProcessStatus.FAILED,
							error_code='UNEXPECTED_ERROR',
							error_message=str(e),
						))
						failed += 1

		duration_ms = int((time.time() - start_time) * 1000)

		report = BatchProcessReport(
			batch_id=batch_id,
			total=total,
			success=success,
			failed=failed,
			skipped=skipped,
			duration_ms=duration_ms,
			results=results,
		)

		logger.info(
			f'Batch {batch_id} completed: {success}/{total} success, '
			f'{failed} failed, {skipped} skipped, {duration_ms}ms'
		)

		return report

	def _process_single(
		self, asset: AssetInput, process_func: ProcessFunc
	) -> AssetProcessResult:
		"""
		处理单个 Asset（带重试）

		Args:
			asset: Asset 输入
			process_func: 处理函数

		Returns:
			AssetProcessResult 对象
		"""
		# 检查是否跳过
		if asset.skip:
			logger.debug(f'Skipping {asset.aid}: {asset.skip_reason}')
			return AssetProcessResult(
				aid=asset.aid,
				status=ProcessStatus.SKIPPED,
				error_message=asset.skip_reason,
			)

		start_time = time.time()
		last_error: Exception | None = None
		retry_count = 0

		for attempt in range(self._config.max_retries + 1):
			try:
				result = process_func(asset)
				duration_ms = int((time.time() - start_time) * 1000)

				# 更新 duration 和 retry_count
				return AssetProcessResult(
					aid=result.aid,
					status=result.status,
					error_code=result.error_code,
					error_message=result.error_message,
					retry_count=retry_count,
					duration_ms=duration_ms,
					output=result.output,
				)

			except Exception as e:
				last_error = e
				retry_count = attempt

				if attempt < self._config.max_retries:
					logger.warning(
						f'Retry {attempt + 1}/{self._config.max_retries} for {asset.aid}: {e}'
					)
					time.sleep(self._config.retry_delay_ms / 1000)
				else:
					logger.error(f'All retries exhausted for {asset.aid}: {e}')

		# 所有重试都失败
		duration_ms = int((time.time() - start_time) * 1000)
		return AssetProcessResult(
			aid=asset.aid,
			status=ProcessStatus.FAILED,
			error_code='MAX_RETRIES_EXCEEDED',
			error_message=str(last_error) if last_error else 'Unknown error',
			retry_count=retry_count,
			duration_ms=duration_ms,
		)

	def process_with_callback(
		self,
		*,
		batch_id: str,
		assets: list[AssetInput],
		process_func: ProcessFunc,
		on_progress: Callable[[int, int, AssetProcessResult], None] | None = None,
		on_complete: Callable[[BatchProcessReport], None] | None = None,
	) -> BatchProcessReport:
		"""
		批量处理 Assets（带回调）

		Args:
			batch_id: 批次 ID
			assets: Asset 输入列表
			process_func: 处理函数
			on_progress: 进度回调 (current, total, result)
			on_complete: 完成回调 (report)

		Returns:
			BatchProcessReport 对象
		"""
		start_time = time.time()
		results: list[AssetProcessResult] = []

		total = len(assets)
		success = 0
		failed = 0
		skipped = 0

		for i, asset in enumerate(assets):
			result = self._process_single(asset, process_func)
			results.append(result)

			if result.status == ProcessStatus.SUCCESS:
				success += 1
			elif result.status == ProcessStatus.FAILED:
				failed += 1
			else:
				skipped += 1

			if on_progress:
				on_progress(i + 1, total, result)

		duration_ms = int((time.time() - start_time) * 1000)

		report = BatchProcessReport(
			batch_id=batch_id,
			total=total,
			success=success,
			failed=failed,
			skipped=skipped,
			duration_ms=duration_ms,
			results=results,
		)

		if on_complete:
			on_complete(report)

		return report


def create_asset_input(
	aid: str,
	data: Any,
	*,
	skip: bool = False,
	skip_reason: str | None = None,
) -> AssetInput:
	"""
	便捷函数：创建 AssetInput

	Args:
		aid: Asset ID
		data: Asset 数据
		skip: 是否跳过
		skip_reason: 跳过原因

	Returns:
		AssetInput 对象
	"""
	return AssetInput(
		aid=aid,
		data=data,
		skip=skip,
		skip_reason=skip_reason,
	)


def create_success_result(aid: str, output: Any = None) -> AssetProcessResult:
	"""
	便捷函数：创建成功结果

	Args:
		aid: Asset ID
		output: 输出数据

	Returns:
		AssetProcessResult 对象
	"""
	return AssetProcessResult(
		aid=aid,
		status=ProcessStatus.SUCCESS,
		output=output,
	)


def create_failed_result(
	aid: str,
	error_code: str,
	error_message: str,
) -> AssetProcessResult:
	"""
	便捷函数：创建失败结果

	Args:
		aid: Asset ID
		error_code: 错误代码
		error_message: 错误消息

	Returns:
		AssetProcessResult 对象
	"""
	return AssetProcessResult(
		aid=aid,
		status=ProcessStatus.FAILED,
		error_code=error_code,
		error_message=error_message,
	)
