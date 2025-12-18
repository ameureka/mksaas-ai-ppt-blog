"""
AIAdapter 模块
负责执行外部 AI 命令并管理文件交换
"""

from __future__ import annotations

import json
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class AIAdapterConfig:
	"""AI 适配器配置"""

	command_template: list[str]  # e.g., ["gemini-cli", "{prompt}", "-o", "{output}"]
	timeout_seconds: int = 60
	max_retries: int = 2
	pending_dir: Path = field(default_factory=lambda: Path('ai_tasks/pending'))
	completed_dir: Path = field(default_factory=lambda: Path('ai_tasks/completed'))


@dataclass(frozen=True)
class AICallResult:
	"""AI 调用结果"""

	success: bool
	output_path: Path | None
	payload: dict[str, Any] | None
	error_code: str | None
	error_message: str | None
	duration_ms: int
	retry_count: int = 0


class AIAdapter:
	"""AI 调用适配器"""

	def __init__(self, config: AIAdapterConfig) -> None:
		self._config = config

	def run(self, prompt_path: Path, output_path: Path) -> dict[str, Any]:
		"""
		执行 AI 命令（兼容旧接口）

		Args:
			prompt_path: Prompt 文件路径
			output_path: 输出文件路径

		Returns:
			AI 输出的 JSON 对象

		Raises:
			RuntimeError: AI 命令执行失败
			ValueError: AI 输出无效
		"""
		result = self.run_with_retry(prompt_path, output_path)
		if not result.success:
			raise RuntimeError(f'{result.error_code}: {result.error_message}')
		if result.payload is None:
			raise ValueError('AI output is None')
		return result.payload

	def run_once(self, prompt_path: Path, output_path: Path) -> AICallResult:
		"""
		执行单次 AI 命令

		Args:
			prompt_path: Prompt 文件路径
			output_path: 输出文件路径

		Returns:
			AICallResult 对象
		"""
		start_time = time.time()

		# 构建命令参数
		args = [
			part.format(prompt=str(prompt_path), output=str(output_path))
			for part in self._config.command_template
		]

		# 确保输出目录存在
		output_path.parent.mkdir(parents=True, exist_ok=True)

		try:
			result = subprocess.run(
				args,
				capture_output=True,
				text=True,
				timeout=self._config.timeout_seconds,
			)
			duration_ms = int((time.time() - start_time) * 1000)

			if result.returncode != 0:
				return AICallResult(
					success=False,
					output_path=None,
					payload=None,
					error_code='AI_EXEC_FAILED',
					error_message=f'Exit code {result.returncode}: {result.stderr}',
					duration_ms=duration_ms,
				)

			# 检查输出文件
			if not output_path.exists():
				return AICallResult(
					success=False,
					output_path=None,
					payload=None,
					error_code='AI_OUTPUT_INVALID',
					error_message=f'Output file not found: {output_path}',
					duration_ms=duration_ms,
				)

			# 解析 JSON
			try:
				content = output_path.read_text(encoding='utf-8')
				payload = json.loads(content)
				if not isinstance(payload, dict):
					return AICallResult(
						success=False,
						output_path=output_path,
						payload=None,
						error_code='AI_OUTPUT_INVALID',
						error_message='AI output is not a JSON object',
						duration_ms=duration_ms,
					)
			except json.JSONDecodeError as e:
				return AICallResult(
					success=False,
					output_path=output_path,
					payload=None,
					error_code='AI_OUTPUT_INVALID',
					error_message=f'Invalid JSON: {e}',
					duration_ms=duration_ms,
				)

			return AICallResult(
				success=True,
				output_path=output_path,
				payload=payload,
				error_code=None,
				error_message=None,
				duration_ms=duration_ms,
			)

		except subprocess.TimeoutExpired:
			duration_ms = int((time.time() - start_time) * 1000)
			return AICallResult(
				success=False,
				output_path=None,
				payload=None,
				error_code='AI_TIMEOUT',
				error_message=f'Command timed out after {self._config.timeout_seconds}s',
				duration_ms=duration_ms,
			)
		except Exception as e:
			duration_ms = int((time.time() - start_time) * 1000)
			return AICallResult(
				success=False,
				output_path=None,
				payload=None,
				error_code='AI_EXEC_FAILED',
				error_message=str(e),
				duration_ms=duration_ms,
			)

	def run_with_retry(self, prompt_path: Path, output_path: Path) -> AICallResult:
		"""
		执行 AI 命令（带重试）

		Args:
			prompt_path: Prompt 文件路径
			output_path: 输出文件路径

		Returns:
			AICallResult 对象
		"""
		last_result: AICallResult | None = None

		for attempt in range(self._config.max_retries + 1):
			result = self.run_once(prompt_path, output_path)

			if result.success:
				return AICallResult(
					success=True,
					output_path=result.output_path,
					payload=result.payload,
					error_code=None,
					error_message=None,
					duration_ms=result.duration_ms,
					retry_count=attempt,
				)

			last_result = result

			# 如果是超时或执行失败，可以重试
			if result.error_code in ('AI_TIMEOUT', 'AI_EXEC_FAILED') and attempt < self._config.max_retries:
				continue

			# 其他错误不重试
			break

		# 返回最后一次失败的结果
		if last_result:
			return AICallResult(
				success=False,
				output_path=last_result.output_path,
				payload=last_result.payload,
				error_code=last_result.error_code,
				error_message=last_result.error_message,
				duration_ms=last_result.duration_ms,
				retry_count=self._config.max_retries,
			)

		# 不应该到达这里
		return AICallResult(
			success=False,
			output_path=None,
			payload=None,
			error_code='AI_EXEC_FAILED',
			error_message='Unknown error',
			duration_ms=0,
			retry_count=0,
		)
