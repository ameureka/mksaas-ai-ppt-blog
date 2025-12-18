"""
AIAdapter 增强版单元测试
"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.factory.ai.ai_adapter import AIAdapter, AIAdapterConfig, AICallResult


@pytest.fixture
def config() -> AIAdapterConfig:
	"""创建测试配置"""
	return AIAdapterConfig(
		command_template=['echo', '{prompt}', '{output}'],
		timeout_seconds=5,
		max_retries=2,
	)


@pytest.fixture
def valid_output(tmp_path: Path) -> Path:
	"""创建有效的输出文件"""
	output_file = tmp_path / 'output.json'
	output_file.write_text(
		json.dumps({
			'ai_summary': '测试摘要',
			'ai_keywords': ['关键词1', '关键词2'],
			'ai_scenario': '测试场景',
			'ai_color_scheme': '蓝色',
			'ai_structure_features': '结构特点',
			'ai_template_features': '模板特点',
			'ppthub_category': 'business',
			'language': '中文',
		}),
		encoding='utf-8',
	)
	return output_file


def test_ai_call_result_dataclass() -> None:
	"""测试 AICallResult 数据类"""
	result = AICallResult(
		success=True,
		output_path=Path('/test/output.json'),
		payload={'key': 'value'},
		error_code=None,
		error_message=None,
		duration_ms=100,
		retry_count=0,
	)

	assert result.success is True
	assert result.payload == {'key': 'value'}
	assert result.duration_ms == 100


def test_ai_adapter_config_defaults() -> None:
	"""测试配置默认值"""
	config = AIAdapterConfig(command_template=['test'])

	assert config.timeout_seconds == 60
	assert config.max_retries == 2
	assert config.pending_dir == Path('ai_tasks/pending')
	assert config.completed_dir == Path('ai_tasks/completed')


def test_run_once_success(tmp_path: Path) -> None:
	"""测试单次执行成功"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test prompt', encoding='utf-8')

	output_file = tmp_path / 'output.json'
	output_data = {'ai_summary': '测试', 'ai_keywords': []}

	# 创建一个会生成输出文件的脚本
	script_file = tmp_path / 'script.sh'
	script_file.write_text(
		f'#!/bin/bash\necho \'{json.dumps(output_data)}\' > "$2"',
		encoding='utf-8',
	)
	script_file.chmod(0o755)

	config = AIAdapterConfig(
		command_template=['bash', str(script_file), '{prompt}', '{output}'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is True
	assert result.payload == output_data
	assert result.error_code is None
	assert result.duration_ms >= 0


def test_run_once_command_failed(tmp_path: Path, config: AIAdapterConfig) -> None:
	"""测试命令执行失败"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	# 使用一个会失败的命令
	config = AIAdapterConfig(
		command_template=['false'],  # 总是返回非零退出码
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is False
	assert result.error_code == 'AI_EXEC_FAILED'


def test_run_once_output_not_found(tmp_path: Path) -> None:
	"""测试输出文件不存在"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	# 使用 echo 命令，不会创建输出文件
	config = AIAdapterConfig(
		command_template=['echo', 'test'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is False
	assert result.error_code == 'AI_OUTPUT_INVALID'
	assert 'not found' in result.error_message.lower()


def test_run_once_invalid_json(tmp_path: Path) -> None:
	"""测试无效的 JSON 输出"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	# 创建一个会生成无效 JSON 的脚本
	script_file = tmp_path / 'script.sh'
	script_file.write_text(
		f'#!/bin/bash\necho "not valid json" > "$2"',
		encoding='utf-8',
	)
	script_file.chmod(0o755)

	config = AIAdapterConfig(
		command_template=['bash', str(script_file), '{prompt}', '{output}'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is False
	assert result.error_code == 'AI_OUTPUT_INVALID'
	assert 'json' in result.error_message.lower()


def test_run_once_non_object_json(tmp_path: Path) -> None:
	"""测试非对象的 JSON 输出"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	# 创建一个会生成数组 JSON 的脚本
	script_file = tmp_path / 'script.sh'
	script_file.write_text(
		f'#!/bin/bash\necho "[1, 2, 3]" > "$2"',
		encoding='utf-8',
	)
	script_file.chmod(0o755)

	config = AIAdapterConfig(
		command_template=['bash', str(script_file), '{prompt}', '{output}'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is False
	assert result.error_code == 'AI_OUTPUT_INVALID'
	assert 'not a JSON object' in result.error_message


def test_run_once_timeout(tmp_path: Path) -> None:
	"""测试命令超时"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	config = AIAdapterConfig(
		command_template=['sleep', '10'],
		timeout_seconds=1,
	)
	adapter = AIAdapter(config)

	result = adapter.run_once(prompt_file, output_file)

	assert result.success is False
	assert result.error_code == 'AI_TIMEOUT'


def test_run_with_retry_success_first_attempt(tmp_path: Path) -> None:
	"""测试重试机制 - 首次成功"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'
	output_data = {'test': 'data'}

	script_file = tmp_path / 'script.sh'
	script_file.write_text(
		f'#!/bin/bash\necho \'{json.dumps(output_data)}\' > "$2"',
		encoding='utf-8',
	)
	script_file.chmod(0o755)

	config = AIAdapterConfig(
		command_template=['bash', str(script_file), '{prompt}', '{output}'],
		timeout_seconds=5,
		max_retries=2,
	)
	adapter = AIAdapter(config)

	result = adapter.run_with_retry(prompt_file, output_file)

	assert result.success is True
	assert result.retry_count == 0


def test_run_with_retry_all_failed(tmp_path: Path) -> None:
	"""测试重试机制 - 全部失败"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	config = AIAdapterConfig(
		command_template=['false'],
		timeout_seconds=5,
		max_retries=2,
	)
	adapter = AIAdapter(config)

	result = adapter.run_with_retry(prompt_file, output_file)

	assert result.success is False
	assert result.retry_count == 2


def test_run_legacy_interface_success(tmp_path: Path) -> None:
	"""测试旧接口兼容性 - 成功"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'
	output_data = {'test': 'data'}

	script_file = tmp_path / 'script.sh'
	script_file.write_text(
		f'#!/bin/bash\necho \'{json.dumps(output_data)}\' > "$2"',
		encoding='utf-8',
	)
	script_file.chmod(0o755)

	config = AIAdapterConfig(
		command_template=['bash', str(script_file), '{prompt}', '{output}'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	result = adapter.run(prompt_file, output_file)

	assert result == output_data


def test_run_legacy_interface_failure(tmp_path: Path) -> None:
	"""测试旧接口兼容性 - 失败"""
	prompt_file = tmp_path / 'prompt.md'
	prompt_file.write_text('test', encoding='utf-8')
	output_file = tmp_path / 'output.json'

	config = AIAdapterConfig(
		command_template=['false'],
		timeout_seconds=5,
	)
	adapter = AIAdapter(config)

	with pytest.raises(RuntimeError):
		adapter.run(prompt_file, output_file)
