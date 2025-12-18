from __future__ import annotations

import json

from factory.ai.ai_parser import AiParser


def test_property7_ai_meta_validation() -> None:
	parser = AiParser(
		forbidden_keywords=['BAD'],
		valid_categories={'general', 'report', 'finance'},
	)

	valid_payload = {
		'ai_summary': '短摘要',
		'ai_content_summary': '详细的SEO优化描述，包含更多内容用于搜索引擎优化',
		'ai_keywords': ['k1', 'k2'],
		'ai_scenario': 'biz',
		'ai_color_scheme': 'blue',
		'ai_structure_features': '3 sections',
		'ai_template_features': 'clean',
		'ppthub_category': 'general',
		'language': '中文',
	}
	meta = parser.parse(valid_payload)
	assert meta.ai_summary == '短摘要'
	assert meta.ai_content_summary == '详细的SEO优化描述，包含更多内容用于搜索引擎优化'

	# Long summary: truncate + warning (no raise)
	meta_long = parser.parse(
		{
			'ai_summary': 'x' * 201,
			**{k: v for k, v in valid_payload.items() if k != 'ai_summary'},
		}
	)
	assert len(meta_long.ai_summary) == 200
	assert any('ai_summary truncated' in w for w in meta_long.warnings)

	# Invalid category: fallback + warning (no raise)
	meta_cat = parser.parse({**valid_payload, 'ppthub_category': 'unknown'})
	assert meta_cat.ppthub_category == 'general'
	assert any('invalid category' in w for w in meta_cat.warnings)

	# Invalid language: fallback + warning (no raise)
	meta_lang = parser.parse({**valid_payload, 'language': 'Fr'})
	assert meta_lang.language == '其他'
	assert any('invalid language' in w for w in meta_lang.warnings)

	# Forbidden keyword: still raises
	with_unsafe = {**valid_payload, 'ai_summary': 'contains BAD'}
	try:
		parser.parse(with_unsafe)
		assert False, f'expected invalid for payload: {json.dumps(with_unsafe, ensure_ascii=False)}'
	except Exception:
		pass
