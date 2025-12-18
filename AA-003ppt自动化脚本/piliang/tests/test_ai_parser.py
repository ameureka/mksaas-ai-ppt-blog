from __future__ import annotations

import pytest

from factory.ai.ai_parser import AiParser


def _build_parser():
	return AiParser(forbidden_keywords=['BAD'], valid_categories={'general', 'report'})


def _valid_payload():
	return {
		'ai_summary': 'short summary',
		'ai_content_summary': 'detailed content summary for SEO optimization with more text',
		'ai_keywords': ['k1', 'k2'],
		'ai_scenario': 'business',
		'ai_color_scheme': 'blue',
		'ai_structure_features': '3 sections',
		'ai_template_features': 'clean',
		'ppthub_category': 'general',
		'language': '中文',
	}


def test_ai_parser_accepts_valid_payload():
	parser = _build_parser()
	payload = _valid_payload()
	meta = parser.parse(payload)
	assert meta.ppthub_category == 'general'
	assert meta.language == '中文'
	assert meta.ai_content_summary == 'detailed content summary for SEO optimization with more text'


@pytest.mark.parametrize(
	'field',
	['ai_summary', 'ai_keywords', 'ai_scenario', 'ai_color_scheme', 'ai_structure_features', 'ai_template_features', 'ppthub_category', 'language'],
)
def test_ai_parser_missing_field(field: str):
	parser = _build_parser()
	payload = _valid_payload()
	payload.pop(field)
	with pytest.raises(ValueError):
		parser.parse(payload)


def test_ai_parser_rejects_forbidden():
	parser = _build_parser()
	payload = _valid_payload()
	payload['ai_summary'] = 'contains BAD'
	with pytest.raises(ValueError):
		parser.parse(payload)


def test_ai_parser_rejects_long_summary():
	"""Long summary is now truncated with warning instead of raising."""
	parser = _build_parser()
	payload = _valid_payload()
	payload['ai_summary'] = 'a' * 600
	meta = parser.parse(payload)
	assert len(meta.ai_summary) == 200  # truncated to max length
	assert any('ai_summary truncated' in w for w in meta.warnings)


def test_ai_parser_rejects_invalid_category_language():
	"""Invalid category/language now fallback with warning instead of raising."""
	parser = _build_parser()
	payload = _valid_payload()
	payload['ppthub_category'] = 'unknown'
	payload['language'] = 'Fr'
	meta = parser.parse(payload)
	assert meta.ppthub_category == 'general'  # fallback
	assert meta.language == '其他'  # fallback
	assert any('invalid category' in w for w in meta.warnings)
	assert any('invalid language' in w for w in meta.warnings)


def test_ai_parser_missing_content_summary_fallback():
	"""Missing ai_content_summary should fallback to ai_summary."""
	parser = _build_parser()
	payload = _valid_payload()
	payload.pop('ai_content_summary')
	meta = parser.parse(payload)
	assert meta.ai_content_summary == meta.ai_summary
	assert any('ai_content_summary missing' in w for w in meta.warnings)
