from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class RuleEngineConfig:
	mapping_path: Path


class RuleEngine:
	def __init__(self, config: RuleEngineConfig) -> None:
		self._config = config
		self._rules = self._load_rules(config.mapping_path)

	@staticmethod
	def _load_rules(path: Path) -> list[tuple[int, str, list[str]]]:
		import yaml  # type: ignore

		data = yaml.safe_load(path.read_text(encoding='utf-8'))
		if not isinstance(data, dict):
			raise ValueError('invalid mapping yaml')

		categories = data.get('categories') or {}
		if not isinstance(categories, dict):
			raise ValueError('invalid categories section')

		rules: list[tuple[int, str, list[str]]] = []
		for slug, cfg in categories.items():
			if not isinstance(cfg, dict):
				continue
			priority = int(cfg.get('priority') or 0)
			keywords = cfg.get('keywords') or []
			if isinstance(keywords, str):
				keywords = [keywords]
			if not isinstance(keywords, list):
				continue
			normalized = [str(k).strip() for k in keywords if str(k).strip()]
			rules.append((priority, slug, normalized))

		# Sort by priority desc.
		return sorted(rules, key=lambda r: r[0], reverse=True)

	def match(self, *, title: str, tags: list[str]) -> str | None:
		title_norm = title.strip()
		tag_norm = [t.strip() for t in tags if t and str(t).strip()]
		for priority, slug, keywords in self._rules:
			for kw in keywords:
				if kw in title_norm:
					return slug
				if any(kw in t for t in tag_norm):
					return slug
		return None
