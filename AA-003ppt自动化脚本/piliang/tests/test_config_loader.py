"""
ConfigLoader 单元测试
"""

from __future__ import annotations

from pathlib import Path

import pytest

from factory.ai.config_loader import (
	AIEnrichmentConfig,
	ConfigLoader,
	ConfigLoadResult,
	load_ai_enrichment_config,
)


class TestConfigLoader:
	"""ConfigLoader 测试"""

	def test_load_returns_config_load_result(self, tmp_path: Path) -> None:
		"""测试 load 返回 ConfigLoadResult"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert isinstance(result, ConfigLoadResult)
		assert result.success is True
		assert result.config is not None
		assert isinstance(result.config, AIEnrichmentConfig)

	def test_load_forbidden_keywords_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载敏感词"""
		env = {'FORBIDDEN_KEYWORDS': 'word1,word2,word3'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.forbidden_keywords == ['word1', 'word2', 'word3']

	def test_load_forbidden_keywords_from_file(self, tmp_path: Path) -> None:
		"""测试从配置文件加载敏感词"""
		configs_dir = tmp_path / 'configs'
		configs_dir.mkdir()
		kw_file = configs_dir / 'forbidden-keywords.txt'
		kw_file.write_text('# comment\nkeyword1\nkeyword2\n\nkeyword3\n', encoding='utf-8')

		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.forbidden_keywords == ['keyword1', 'keyword2', 'keyword3']

	def test_load_forbidden_keywords_env_overrides_file(self, tmp_path: Path) -> None:
		"""测试环境变量覆盖配置文件"""
		configs_dir = tmp_path / 'configs'
		configs_dir.mkdir()
		kw_file = configs_dir / 'forbidden-keywords.txt'
		kw_file.write_text('file_keyword\n', encoding='utf-8')

		env = {'FORBIDDEN_KEYWORDS': 'env_keyword'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.forbidden_keywords == ['env_keyword']

	def test_load_forbidden_keywords_default_when_missing(self, tmp_path: Path) -> None:
		"""测试配置文件不存在时使用默认值"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert '第一PPT' in result.config.forbidden_keywords
		assert '1ppt' in result.config.forbidden_keywords
		assert any('WARN_CONFIG_MISSING' in w for w in result.warnings)

	def test_load_forbidden_keywords_dedup(self, tmp_path: Path) -> None:
		"""测试敏感词去重"""
		env = {'FORBIDDEN_KEYWORDS': 'word1,word2,word1,word3,word2'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.forbidden_keywords == ['word1', 'word2', 'word3']

	def test_load_forbidden_keywords_filter_empty(self, tmp_path: Path) -> None:
		"""测试过滤空值"""
		env = {'FORBIDDEN_KEYWORDS': 'word1,,word2,  ,word3'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.forbidden_keywords == ['word1', 'word2', 'word3']

	def test_load_category_mapping_from_file(self, tmp_path: Path) -> None:
		"""测试从文件加载分类映射"""
		configs_dir = tmp_path / 'configs'
		configs_dir.mkdir()
		yaml_file = configs_dir / 'category-mapping.yaml'
		yaml_file.write_text(
			'version: 1\nfallback: general\ncategories:\n  business:\n    priority: 100\n  education:\n    priority: 90\n',
			encoding='utf-8',
		)

		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert 'business' in result.config.valid_categories
		assert 'education' in result.config.valid_categories
		assert result.config.fallback_category == 'general'

	def test_load_category_mapping_default_when_missing(self, tmp_path: Path) -> None:
		"""测试分类映射文件不存在时使用默认值"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert 'business' in result.config.valid_categories
		assert 'general' in result.config.valid_categories
		assert result.config.fallback_category == 'general'
		assert any('WARN_CONFIG_MISSING' in w and 'category-mapping' in w for w in result.warnings)

	def test_load_ai_command_template_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载 AI 命令模板"""
		env = {'AI_COMMAND_TEMPLATE': 'custom-cli {prompt} --output {output}'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_command_template == ['custom-cli', '{prompt}', '--output', '{output}']

	def test_load_ai_command_template_default(self, tmp_path: Path) -> None:
		"""测试 AI 命令模板默认值"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert '{prompt}' in result.config.ai_command_template
		assert '{output}' in result.config.ai_command_template

	def test_load_ai_timeout_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载 AI 超时"""
		env = {'AI_TIMEOUT_SECONDS': '120'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_timeout_seconds == 120

	def test_load_ai_timeout_invalid_uses_default(self, tmp_path: Path) -> None:
		"""测试无效超时值使用默认值"""
		env = {'AI_TIMEOUT_SECONDS': 'invalid'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_timeout_seconds == 60

	def test_load_ai_timeout_minimum_is_one(self, tmp_path: Path) -> None:
		"""测试超时最小值为 1"""
		env = {'AI_TIMEOUT_SECONDS': '0'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_timeout_seconds == 1

	def test_load_ai_max_retries_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载重试次数"""
		env = {'AI_MAX_RETRIES': '5'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_max_retries == 5

	def test_load_ai_max_retries_default(self, tmp_path: Path) -> None:
		"""测试重试次数默认值"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_max_retries == 2

	def test_load_ai_concurrency_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载并发数"""
		env = {'AI_CONCURRENCY': '4'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_concurrency == 4

	def test_load_ai_concurrency_minimum_is_one(self, tmp_path: Path) -> None:
		"""测试并发数最小值为 1"""
		env = {'AI_CONCURRENCY': '0'}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_concurrency == 1

	def test_load_prompt_template_path_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载 Prompt 模板路径"""
		template_file = tmp_path / 'custom_template.md'
		template_file.write_text('# Template', encoding='utf-8')

		env = {'AI_PROMPT_TEMPLATE_PATH': str(template_file)}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.prompt_template_path == template_file

	def test_load_prompt_template_path_default(self, tmp_path: Path) -> None:
		"""测试 Prompt 模板默认路径"""
		templates_dir = tmp_path / 'templates'
		templates_dir.mkdir()
		template_file = templates_dir / 'ai_prompt_template.md'
		template_file.write_text('# Template', encoding='utf-8')

		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.prompt_template_path == template_file

	def test_load_prompt_template_path_missing_warning(self, tmp_path: Path) -> None:
		"""测试 Prompt 模板不存在时记录警告"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.prompt_template_path is None
		assert any('WARN_CONFIG_MISSING' in w and 'prompt_template' in w.lower() for w in result.warnings)

	def test_load_ai_task_dirs_from_env(self, tmp_path: Path) -> None:
		"""测试从环境变量加载 AI 任务目录"""
		env = {
			'AI_PENDING_DIR': '/custom/pending',
			'AI_COMPLETED_DIR': '/custom/completed',
		}
		loader = ConfigLoader(project_root=tmp_path, env=env)
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_pending_dir == Path('/custom/pending')
		assert result.config.ai_completed_dir == Path('/custom/completed')

	def test_load_ai_task_dirs_default(self, tmp_path: Path) -> None:
		"""测试 AI 任务目录默认值"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.ai_pending_dir == Path('ai_tasks/pending')
		assert result.config.ai_completed_dir == Path('ai_tasks/completed')

	def test_load_or_raise_success(self, tmp_path: Path) -> None:
		"""测试 load_or_raise 成功"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		config = loader.load_or_raise()

		assert isinstance(config, AIEnrichmentConfig)

	def test_config_warnings_included(self, tmp_path: Path) -> None:
		"""测试配置警告包含在结果中"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		# 配置文件不存在时应该有警告
		assert len(result.warnings) > 0
		# 警告也应该包含在 config 中
		assert result.config.warnings == result.warnings


class TestLoadAiEnrichmentConfig:
	"""便捷函数测试"""

	def test_load_ai_enrichment_config(self, tmp_path: Path) -> None:
		"""测试便捷函数"""
		config = load_ai_enrichment_config(project_root=tmp_path, env={})

		assert isinstance(config, AIEnrichmentConfig)
		assert config.project_root == tmp_path


class TestAIEnrichmentConfigDataclass:
	"""AIEnrichmentConfig 数据类测试"""

	def test_config_is_frozen(self) -> None:
		"""测试配置是不可变的"""
		config = AIEnrichmentConfig()

		with pytest.raises(Exception):  # FrozenInstanceError
			config.ai_timeout_seconds = 999  # type: ignore

	def test_config_default_values(self) -> None:
		"""测试配置默认值"""
		config = AIEnrichmentConfig()

		assert config.ai_timeout_seconds == 60
		assert config.ai_max_retries == 2
		assert config.ai_concurrency == 1
		assert config.fallback_category == 'general'


class TestConfigLoaderPropertyBased:
	"""ConfigLoader 属性测试"""

	def test_property_forbidden_keywords_always_list(self, tmp_path: Path) -> None:
		"""属性: 敏感词始终是列表"""
		test_cases = [
			{},
			{'FORBIDDEN_KEYWORDS': ''},
			{'FORBIDDEN_KEYWORDS': 'single'},
			{'FORBIDDEN_KEYWORDS': 'a,b,c'},
			{'FORBIDDEN_KEYWORDS': 'a\nb\nc'},
		]

		for env in test_cases:
			loader = ConfigLoader(project_root=tmp_path, env=env)
			result = loader.load()
			assert result.config is not None
			assert isinstance(result.config.forbidden_keywords, list)

	def test_property_valid_categories_always_set(self, tmp_path: Path) -> None:
		"""属性: 有效分类始终是集合"""
		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert isinstance(result.config.valid_categories, set)
		assert len(result.config.valid_categories) > 0

	def test_property_fallback_in_valid_categories(self, tmp_path: Path) -> None:
		"""属性: fallback 分类始终在有效分类中"""
		configs_dir = tmp_path / 'configs'
		configs_dir.mkdir()
		yaml_file = configs_dir / 'category-mapping.yaml'
		yaml_file.write_text(
			'version: 1\nfallback: custom_fallback\ncategories:\n  business:\n    priority: 100\n',
			encoding='utf-8',
		)

		loader = ConfigLoader(project_root=tmp_path, env={})
		result = loader.load()

		assert result.config is not None
		assert result.config.fallback_category in result.config.valid_categories

	def test_property_timeout_always_positive(self, tmp_path: Path) -> None:
		"""属性: 超时始终为正数"""
		test_values = ['-1', '0', '1', '100', 'invalid', '']

		for val in test_values:
			env = {'AI_TIMEOUT_SECONDS': val} if val else {}
			loader = ConfigLoader(project_root=tmp_path, env=env)
			result = loader.load()
			assert result.config is not None
			assert result.config.ai_timeout_seconds >= 1

	def test_property_concurrency_always_positive(self, tmp_path: Path) -> None:
		"""属性: 并发数始终为正数"""
		test_values = ['-1', '0', '1', '100', 'invalid', '']

		for val in test_values:
			env = {'AI_CONCURRENCY': val} if val else {}
			loader = ConfigLoader(project_root=tmp_path, env=env)
			result = loader.load()
			assert result.config is not None
			assert result.config.ai_concurrency >= 1

	def test_property_retries_always_non_negative(self, tmp_path: Path) -> None:
		"""属性: 重试次数始终非负"""
		test_values = ['-1', '0', '1', '100', 'invalid', '']

		for val in test_values:
			env = {'AI_MAX_RETRIES': val} if val else {}
			loader = ConfigLoader(project_root=tmp_path, env=env)
			result = loader.load()
			assert result.config is not None
			assert result.config.ai_max_retries >= 0
