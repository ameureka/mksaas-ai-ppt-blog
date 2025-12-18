"""
ConfigLoader 模块
负责加载 AI Enrichment 相关配置，支持环境变量覆盖和默认值
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _project_root() -> Path:
	"""获取项目根目录"""
	# .../piliang/src/factory/ai/config_loader.py -> parents[4] == .../piliang
	return Path(__file__).resolve().parents[4]


def _split_keywords(raw: str) -> list[str]:
	"""
	解析关键词字符串为列表

	支持逗号分隔和换行分隔，过滤注释行和空值，去重保持顺序
	"""
	items: list[str] = []
	for part in raw.replace(',', '\n').splitlines():
		kw = part.strip()
		if not kw:
			continue
		if kw.startswith('#'):
			continue
		items.append(kw)
	# 去重保持顺序
	seen: set[str] = set()
	unique: list[str] = []
	for kw in items:
		if kw in seen:
			continue
		seen.add(kw)
		unique.append(kw)
	return unique


def _load_yaml(path: Path) -> dict[str, Any]:
	"""加载 YAML 文件"""
	try:
		import yaml  # type: ignore
	except ImportError as exc:  # pragma: no cover
		raise RuntimeError(
			"Missing dependency: pyyaml. Install with `pip install pyyaml`."
		) from exc

	data = yaml.safe_load(path.read_text(encoding='utf-8'))
	if not isinstance(data, dict):
		raise ValueError(f'Invalid yaml root object: {path}')
	return data


@dataclass(frozen=True)
class AIEnrichmentConfig:
	"""AI Enrichment 配置"""

	# 项目路径
	project_root: Path = field(default_factory=_project_root)

	# 敏感词列表
	forbidden_keywords: list[str] = field(default_factory=list)

	# 有效分类集合
	valid_categories: set[str] = field(default_factory=set)

	# 分类映射规则（原始 YAML 数据）
	category_mapping: dict[str, Any] | None = None

	# 默认分类（规则未命中时的兜底）
	fallback_category: str = 'general'

	# AI 命令模板
	ai_command_template: list[str] = field(default_factory=lambda: [
		'gemini', '{prompt}', '-o', '{output}'
	])

	# AI 调用超时（秒）
	ai_timeout_seconds: int = 60

	# AI 调用重试次数
	ai_max_retries: int = 2

	# AI 并发数
	ai_concurrency: int = 1

	# Prompt 模板路径
	prompt_template_path: Path | None = None

	# AI 任务目录
	ai_pending_dir: Path = field(default_factory=lambda: Path('ai_tasks/pending'))
	ai_completed_dir: Path = field(default_factory=lambda: Path('ai_tasks/completed'))

	# 加载警告
	warnings: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ConfigLoadResult:
	"""配置加载结果"""

	success: bool
	config: AIEnrichmentConfig | None
	warnings: list[str] = field(default_factory=list)
	errors: list[str] = field(default_factory=list)


class ConfigLoader:
	"""配置加载器"""

	# 默认敏感词列表
	_default_forbidden_keywords = ['第一PPT', '1ppt', 'www.1ppt.com']

	# 默认有效分类
	_default_valid_categories = {
		'business', 'education', 'technology', 'design', 'marketing',
		'hr', 'medical', 'finance', 'general', 'summary', 'report', 'plan'
	}

	def __init__(
		self,
		*,
		project_root: Path | None = None,
		env: dict[str, str] | None = None,
	) -> None:
		"""
		初始化配置加载器

		Args:
			project_root: 项目根目录，默认自动检测
			env: 环境变量字典，默认使用 os.environ
		"""
		self._project_root = project_root if project_root is not None else _project_root()
		self._env = env if env is not None else dict(os.environ)

	def load(self) -> ConfigLoadResult:
		"""
		加载配置

		Returns:
			ConfigLoadResult 对象
		"""
		warnings: list[str] = []
		errors: list[str] = []

		# 加载敏感词
		forbidden_keywords = self._load_forbidden_keywords(warnings)

		# 加载分类映射
		category_mapping, valid_categories, fallback_category = self._load_category_mapping(warnings)

		# 加载 AI 配置
		ai_command_template = self._load_ai_command_template()
		ai_timeout_seconds = self._load_ai_timeout()
		ai_max_retries = self._load_ai_max_retries()
		ai_concurrency = self._load_ai_concurrency()

		# 加载 Prompt 模板路径
		prompt_template_path = self._load_prompt_template_path(warnings)

		# 加载 AI 任务目录
		ai_pending_dir, ai_completed_dir = self._load_ai_task_dirs()

		config = AIEnrichmentConfig(
			project_root=self._project_root,
			forbidden_keywords=forbidden_keywords,
			valid_categories=valid_categories,
			category_mapping=category_mapping,
			fallback_category=fallback_category,
			ai_command_template=ai_command_template,
			ai_timeout_seconds=ai_timeout_seconds,
			ai_max_retries=ai_max_retries,
			ai_concurrency=ai_concurrency,
			prompt_template_path=prompt_template_path,
			ai_pending_dir=ai_pending_dir,
			ai_completed_dir=ai_completed_dir,
			warnings=warnings,
		)

		return ConfigLoadResult(
			success=len(errors) == 0,
			config=config,
			warnings=warnings,
			errors=errors,
		)

	def load_or_raise(self) -> AIEnrichmentConfig:
		"""
		加载配置，失败时抛出异常

		Returns:
			AIEnrichmentConfig 对象

		Raises:
			RuntimeError: 配置加载失败
		"""
		result = self.load()
		if not result.success:
			raise RuntimeError(f'Config load failed: {", ".join(result.errors)}')
		if result.config is None:
			raise RuntimeError('Config load returned None')
		return result.config

	def _load_forbidden_keywords(self, warnings: list[str]) -> list[str]:
		"""加载敏感词列表"""
		# 优先使用环境变量
		env_value = self._env.get('FORBIDDEN_KEYWORDS', '').strip()
		if env_value:
			keywords = _split_keywords(env_value)
			logger.debug(f'Loaded {len(keywords)} forbidden keywords from env')
			return keywords

		# 从配置文件加载
		config_path = self._project_root / 'configs' / 'forbidden-keywords.txt'
		if config_path.exists():
			try:
				raw = config_path.read_text(encoding='utf-8')
				keywords = _split_keywords(raw)
				logger.debug(f'Loaded {len(keywords)} forbidden keywords from {config_path}')
				return keywords
			except Exception as e:
				warnings.append(f'WARN_CONFIG_READ_ERROR: {config_path}: {e}')
				logger.warning(f'Failed to read forbidden keywords: {e}')

		# 使用默认值
		warnings.append('WARN_CONFIG_MISSING: forbidden-keywords.txt not found, using defaults')
		logger.warning('forbidden-keywords.txt not found, using default forbidden keywords')
		return list(self._default_forbidden_keywords)

	def _load_category_mapping(
		self, warnings: list[str]
	) -> tuple[dict[str, Any] | None, set[str], str]:
		"""加载分类映射规则"""
		config_path = self._project_root / 'configs' / 'category-mapping.yaml'

		if not config_path.exists():
			warnings.append('WARN_CONFIG_MISSING: category-mapping.yaml not found, using defaults')
			logger.warning('category-mapping.yaml not found, using default categories')
			return None, set(self._default_valid_categories), 'general'

		try:
			data = _load_yaml(config_path)
			categories_data = data.get('categories', {})
			valid_categories = set(categories_data.keys())
			fallback = data.get('fallback', 'general')

			# 确保 fallback 在有效分类中
			if fallback not in valid_categories:
				valid_categories.add(fallback)

			logger.debug(f'Loaded {len(valid_categories)} categories from {config_path}')
			return data, valid_categories, fallback

		except Exception as e:
			warnings.append(f'WARN_CONFIG_READ_ERROR: {config_path}: {e}')
			logger.warning(f'Failed to read category mapping: {e}')
			return None, set(self._default_valid_categories), 'general'

	def _load_ai_command_template(self) -> list[str]:
		"""加载 AI 命令模板"""
		env_value = self._env.get('AI_COMMAND_TEMPLATE', '').strip()
		if env_value:
			# 简单的空格分割，支持 {prompt} 和 {output} 占位符
			return env_value.split()
		return ['gemini', '{prompt}', '-o', '{output}']

	def _load_ai_timeout(self) -> int:
		"""加载 AI 调用超时"""
		env_value = self._env.get('AI_TIMEOUT_SECONDS', '').strip()
		if env_value:
			try:
				return max(1, int(env_value))
			except ValueError:
				logger.warning(f'Invalid AI_TIMEOUT_SECONDS: {env_value}, using default 60')
		return 60

	def _load_ai_max_retries(self) -> int:
		"""加载 AI 调用重试次数"""
		env_value = self._env.get('AI_MAX_RETRIES', '').strip()
		if env_value:
			try:
				return max(0, int(env_value))
			except ValueError:
				logger.warning(f'Invalid AI_MAX_RETRIES: {env_value}, using default 2')
		return 2

	def _load_ai_concurrency(self) -> int:
		"""加载 AI 并发数"""
		env_value = self._env.get('AI_CONCURRENCY', '').strip()
		if env_value:
			try:
				return max(1, int(env_value))
			except ValueError:
				logger.warning(f'Invalid AI_CONCURRENCY: {env_value}, using default 1')
		return 1

	def _load_prompt_template_path(self, warnings: list[str]) -> Path | None:
		"""加载 Prompt 模板路径"""
		# 优先使用环境变量
		env_value = self._env.get('AI_PROMPT_TEMPLATE_PATH', '').strip()
		if env_value:
			path = Path(env_value)
			if path.exists():
				return path
			warnings.append(f'WARN_CONFIG_MISSING: AI_PROMPT_TEMPLATE_PATH={env_value} not found')
			logger.warning(f'Prompt template not found: {env_value}')

		# 默认路径
		default_path = self._project_root / 'templates' / 'ai_prompt_template.md'
		if default_path.exists():
			return default_path

		warnings.append('WARN_CONFIG_MISSING: ai_prompt_template.md not found')
		logger.warning('Prompt template not found at default location')
		return None

	def _load_ai_task_dirs(self) -> tuple[Path, Path]:
		"""加载 AI 任务目录"""
		pending_env = self._env.get('AI_PENDING_DIR', '').strip()
		completed_env = self._env.get('AI_COMPLETED_DIR', '').strip()

		pending_dir = Path(pending_env) if pending_env else Path('ai_tasks/pending')
		completed_dir = Path(completed_env) if completed_env else Path('ai_tasks/completed')

		return pending_dir, completed_dir


def load_ai_enrichment_config(
	*,
	project_root: Path | None = None,
	env: dict[str, str] | None = None,
) -> AIEnrichmentConfig:
	"""
	便捷函数：加载 AI Enrichment 配置

	Args:
		project_root: 项目根目录
		env: 环境变量字典

	Returns:
		AIEnrichmentConfig 对象
	"""
	loader = ConfigLoader(project_root=project_root, env=env)
	return loader.load_or_raise()
