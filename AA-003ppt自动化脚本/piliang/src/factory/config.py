from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _project_root() -> Path:
	# .../piliang/src/factory/config.py -> parents[2] == .../piliang
	return Path(__file__).resolve().parents[2]


def _split_keywords(raw: str) -> list[str]:
	items: list[str] = []
	for part in raw.replace(',', '\n').splitlines():
		kw = part.strip()
		if not kw:
			continue
		if kw.startswith('#'):
			continue
		items.append(kw)
	# de-dup while keeping order
	seen: set[str] = set()
	unique: list[str] = []
	for kw in items:
		if kw in seen:
			continue
		seen.add(kw)
		unique.append(kw)
	return unique


def _load_yaml(path: Path) -> dict[str, Any]:
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


def _load_brand_replacements(path: Path) -> list[tuple[str, str]]:
	"""
	Load brand replacement rules from a txt file.

	Format:
	  <source> -> <replacement>
	- Lines starting with `#` are comments.
	- Replacement can be empty (meaning delete).
	"""
	rules: list[tuple[str, str]] = []
	seen: set[str] = set()
	for raw_line in path.read_text(encoding='utf-8').splitlines():
		line = raw_line.strip()
		if not line:
			continue
		if line.startswith('#'):
			continue
		if '->' not in line:
			continue
		left, right = line.split('->', 1)
		source = left.strip()
		replacement = right.strip()
		if not source:
			continue
		# de-dup by source while keeping first occurrence
		if source in seen:
			continue
		seen.add(source)
		rules.append((source, replacement))
	return rules


@dataclass(frozen=True)
class FactoryConfig:
	project_root: Path = field(default_factory=_project_root)
	data_root: Path = field(default_factory=lambda: _project_root() / 'data')
	templates_dir: Path = field(default_factory=lambda: _project_root() / 'templates')
	storage_public_url: str | None = None
	category_mapping_path: Path = field(
		default_factory=lambda: _project_root() / 'configs' / 'category-mapping.yaml'
	)
	forbidden_keywords: list[str] = field(default_factory=list)
	brand_replacements: list[tuple[str, str]] = field(default_factory=list)
	concurrency: int = 4
	category_mapping_raw: dict[str, Any] | None = None
	head_prune_max: int = 2


def load_factory_config(
	*,
	env: dict[str, str] | None = None,
	project_root: Path | None = None,
) -> FactoryConfig:
	effective_env = env if env is not None else dict(os.environ)
	root = project_root if project_root is not None else _project_root()

	storage_public_url = effective_env.get('STORAGE_PUBLIC_URL') or None
	concurrency_raw = effective_env.get('PILIANG_CONCURRENCY') or '4'
	try:
		concurrency = max(1, int(concurrency_raw))
	except ValueError:
		concurrency = 4

	forbidden_raw = effective_env.get('FORBIDDEN_KEYWORDS') or ''
	if forbidden_raw.strip():
		forbidden_keywords = _split_keywords(forbidden_raw)
	else:
		kw_file = root / 'configs' / 'forbidden-keywords.txt'
		if kw_file.exists():
			forbidden_keywords = _split_keywords(kw_file.read_text(encoding='utf-8'))
		else:
			forbidden_keywords = ['第一PPT', '1ppt', 'www.1ppt.com']

	brand_replacements: list[tuple[str, str]] = []
	replacements_path = root / 'configs' / 'brand-replacement.txt'
	if replacements_path.exists():
		brand_replacements = _load_brand_replacements(replacements_path)

	category_mapping_path = root / 'configs' / 'category-mapping.yaml'
	category_mapping_raw = (
		_load_yaml(category_mapping_path) if category_mapping_path.exists() else None
	)

	return FactoryConfig(
		project_root=root,
		data_root=root / 'data',
		templates_dir=root / 'templates',
		storage_public_url=storage_public_url,
		category_mapping_path=category_mapping_path,
		forbidden_keywords=forbidden_keywords,
		brand_replacements=brand_replacements,
		concurrency=concurrency,
		category_mapping_raw=category_mapping_raw,
		head_prune_max=2,
	)
