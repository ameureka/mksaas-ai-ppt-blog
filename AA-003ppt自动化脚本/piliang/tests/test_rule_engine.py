from __future__ import annotations

from pathlib import Path

from factory.rules.rule_engine import RuleEngine, RuleEngineConfig


def test_rule_engine_matches_highest_priority(tmp_path: Path) -> None:
	# Prepare a small mapping file with priorities.
	mapping = {
		'categories': {
			'a': {'priority': 10, 'keywords': ['金融']},
			'b': {'priority': 20, 'keywords': ['金融']},  # higher priority
			'c': {'priority': 5, 'keywords': ['教育']},
		}
	}
	yaml_path = tmp_path / 'mapping.yaml'
	yaml_path.write_text(
		"categories:\n"
		"  a:\n    priority: 10\n    keywords: ['金融']\n"
		"  b:\n    priority: 20\n    keywords: ['金融']\n"
		"  c:\n    priority: 5\n    keywords: ['教育']\n",
		encoding='utf-8',
	)

	re = RuleEngine(RuleEngineConfig(mapping_path=yaml_path))
	slug = re.match(title='年度金融报告', tags=['年度'])
	assert slug == 'b'


def test_rule_engine_returns_none_when_no_match(tmp_path: Path) -> None:
	yaml_path = tmp_path / 'mapping.yaml'
	yaml_path.write_text(
		"categories:\n"
		"  a:\n    priority: 10\n    keywords: ['金融']\n",
		encoding='utf-8',
	)
	re = RuleEngine(RuleEngineConfig(mapping_path=yaml_path))
	assert re.match(title='教育方案', tags=['培训']) is None
