"""
LanguageDetector 模块单元测试
"""

import pytest

from factory.ai.language_detector import LanguageDetector, LanguageDetectionResult


def test_detect_chinese() -> None:
	"""测试检测中文"""
	detector = LanguageDetector()
	text = '这是一段中文文本，用于测试语言检测功能。'

	result = detector.detect(text)

	assert result.code == 'zh'
	assert result.display == '中文'
	assert result.chinese_ratio > 0.3
	assert result.source == 'rule'


def test_detect_english() -> None:
	"""测试检测英文"""
	detector = LanguageDetector()
	text = 'This is an English text for testing language detection functionality.'

	result = detector.detect(text)

	assert result.code == 'en'
	assert result.display == 'English'
	assert result.english_ratio > 0.7
	assert result.source == 'rule'


def test_detect_mixed() -> None:
	"""测试检测混合语言"""
	detector = LanguageDetector()
	text = 'Hello 你好 123 !@#'

	result = detector.detect(text)

	assert result.code == 'other'
	assert result.display == '其他'
	assert result.source == 'rule'


def test_detect_empty_text() -> None:
	"""测试空文本"""
	detector = LanguageDetector()
	result = detector.detect('')

	assert result.code == 'other'
	assert result.display == '其他'
	assert result.chinese_ratio == 0.0
	assert result.english_ratio == 0.0


def test_detect_with_custom_thresholds() -> None:
	"""测试自定义阈值"""
	detector = LanguageDetector(chinese_threshold=0.5, english_threshold=0.8)
	text = '这是中文 with some English'

	result = detector.detect(text)

	# 中文占比可能不到 50%，应该判定为 other
	assert result.code in ['zh', 'other']


def test_map_to_display() -> None:
	"""测试代码到显示名称的映射"""
	detector = LanguageDetector()

	assert detector.map_to_display('zh') == '中文'
	assert detector.map_to_display('en') == 'English'
	assert detector.map_to_display('other') == '其他'
	assert detector.map_to_display('invalid') == '其他'


def test_map_to_code() -> None:
	"""测试显示名称到代码的映射"""
	detector = LanguageDetector()

	assert detector.map_to_code('中文') == 'zh'
	assert detector.map_to_code('English') == 'en'
	assert detector.map_to_code('其他') == 'other'
	assert detector.map_to_code('invalid') == 'other'


def test_is_valid_display() -> None:
	"""测试显示名称有效性检查"""
	detector = LanguageDetector()

	assert detector.is_valid_display('中文') is True
	assert detector.is_valid_display('English') is True
	assert detector.is_valid_display('其他') is True
	assert detector.is_valid_display('invalid') is False
	assert detector.is_valid_display('') is False


def test_merge_with_ai_valid() -> None:
	"""测试与有效的 AI 输出合并"""
	detector = LanguageDetector()
	rule_result = LanguageDetectionResult(
		code='zh', display='中文', chinese_ratio=0.8, english_ratio=0.1, source='rule'
	)

	# AI 输出为英文
	merged = detector.merge_with_ai(rule_result, 'English')

	assert merged.code == 'en'
	assert merged.display == 'English'
	assert merged.source == 'ai'
	assert merged.chinese_ratio == 0.8  # 保留原始比例
	assert merged.english_ratio == 0.1


def test_merge_with_ai_invalid() -> None:
	"""测试与无效的 AI 输出合并"""
	detector = LanguageDetector()
	rule_result = LanguageDetectionResult(
		code='zh', display='中文', chinese_ratio=0.8, english_ratio=0.1, source='rule'
	)

	# AI 输出无效
	merged = detector.merge_with_ai(rule_result, 'invalid')

	assert merged.code == 'zh'
	assert merged.display == '中文'
	assert merged.source == 'fallback'


def test_merge_with_ai_none() -> None:
	"""测试与空 AI 输出合并"""
	detector = LanguageDetector()
	rule_result = LanguageDetectionResult(
		code='en', display='English', chinese_ratio=0.1, english_ratio=0.8, source='rule'
	)

	merged = detector.merge_with_ai(rule_result, None)

	assert merged.code == 'en'
	assert merged.display == 'English'
	assert merged.source == 'fallback'


def test_detect_numbers_and_symbols() -> None:
	"""测试纯数字和符号"""
	detector = LanguageDetector()
	text = '123456 !@#$%^&*()'

	result = detector.detect(text)

	assert result.code == 'other'
	assert result.display == '其他'
	assert result.chinese_ratio == 0.0
	assert result.english_ratio == 0.0


def test_detect_chinese_with_punctuation() -> None:
	"""测试带标点的中文"""
	detector = LanguageDetector()
	text = '这是一段中文，包含标点符号！？。'

	result = detector.detect(text)

	assert result.code == 'zh'
	assert result.display == '中文'


def test_detect_english_with_punctuation() -> None:
	"""测试带标点的英文"""
	detector = LanguageDetector()
	text = 'This is English text, with punctuation marks! And more.'

	result = detector.detect(text)

	assert result.code == 'en'
	assert result.display == 'English'


def test_chinese_ratio_calculation() -> None:
	"""测试中文字符占比计算准确性"""
	detector = LanguageDetector()
	text = '中文abc'  # 2个中文，3个英文，共5个字符

	result = detector.detect(text)

	assert result.chinese_ratio == 0.4  # 2/5
	assert result.english_ratio == 0.6  # 3/5


def test_english_ratio_calculation() -> None:
	"""测试英文字符占比计算准确性"""
	detector = LanguageDetector()
	text = 'abc中文'  # 3个英文，2个中文，共5个字符

	result = detector.detect(text)

	assert result.chinese_ratio == 0.4  # 2/5
	assert result.english_ratio == 0.6  # 3/5
