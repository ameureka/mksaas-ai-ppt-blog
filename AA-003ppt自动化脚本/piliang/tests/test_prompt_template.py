"""
PromptTemplate 模块单元测试
"""

from pathlib import Path

import pytest

from factory.ai.prompt_template import PromptTemplate, PromptTemplateConfig


@pytest.fixture
def template_path(tmp_path: Path) -> Path:
	"""创建临时模板文件"""
	template_file = tmp_path / 'test_template.md'
	template_content = """# PPT 模板元数据生成任务

## 输入信息

- **标题**: {title}
- **频道**: {channel_name}
- **原始标签**: {original_tags}

## PPT 全文内容

{extracted_text}

## 输出格式（JSON）

```json
{
  "ai_summary": "摘要",
  "ai_keywords": ["关键词"],
  "ai_scenario": "场景",
  "ai_color_scheme": "配色",
  "ai_structure_features": "结构特点",
  "ai_template_features": "模板特点",
  "ppthub_category": "分类",
  "language": "语言"
}
```
"""
	template_file.write_text(template_content, encoding='utf-8')
	return template_file


def test_load_template_success(template_path: Path) -> None:
	"""测试成功加载模板"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)

	content = template.load()
	assert content
	assert '{title}' in content
	assert 'ai_summary' in content


def test_load_template_not_found() -> None:
	"""测试模板文件不存在"""
	config = PromptTemplateConfig(template_path=Path('/nonexistent/template.md'))
	template = PromptTemplate(config)

	with pytest.raises(FileNotFoundError):
		template.load()


def test_load_template_empty(tmp_path: Path) -> None:
	"""测试空模板文件"""
	empty_file = tmp_path / 'empty.md'
	empty_file.write_text('', encoding='utf-8')

	config = PromptTemplateConfig(template_path=empty_file)
	template = PromptTemplate(config)

	with pytest.raises(ValueError, match='empty'):
		template.load()


def test_validate_template_success(template_path: Path) -> None:
	"""测试模板校验通过"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)
	template.load()

	missing = template.validate()
	assert missing == []


def test_validate_template_missing_placeholder(tmp_path: Path) -> None:
	"""测试缺失占位符"""
	incomplete_file = tmp_path / 'incomplete.md'
	incomplete_file.write_text(
		"""
# Test Template
{title}
{channel_name}
ai_summary
ai_keywords
ai_scenario
ai_color_scheme
ai_structure_features
ai_template_features
ppthub_category
language
""",
		encoding='utf-8',
	)

	config = PromptTemplateConfig(template_path=incomplete_file)
	template = PromptTemplate(config)
	template.load()

	missing = template.validate()
	assert 'placeholder:{original_tags}' in missing
	assert 'placeholder:{extracted_text}' in missing


def test_validate_template_missing_field(tmp_path: Path) -> None:
	"""测试缺失输出字段"""
	incomplete_file = tmp_path / 'incomplete.md'
	incomplete_file.write_text(
		"""
# Test Template
{title}
{original_tags}
{extracted_text}
{channel_name}
ai_summary
ai_keywords
""",
		encoding='utf-8',
	)

	config = PromptTemplateConfig(template_path=incomplete_file)
	template = PromptTemplate(config)
	template.load()

	missing = template.validate()
	assert 'field:ai_scenario' in missing
	assert 'field:ai_color_scheme' in missing
	assert 'field:ppthub_category' in missing


def test_validate_before_load(template_path: Path) -> None:
	"""测试在加载前校验"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)

	with pytest.raises(ValueError, match='not loaded'):
		template.validate()


def test_render_template_success(template_path: Path) -> None:
	"""测试成功渲染模板"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)
	template.load()

	rendered = template.render(
		title='测试标题',
		original_tags=['标签1', '标签2'],
		extracted_text='这是提取的文本内容',
		channel_name='测试频道',
	)

	assert '测试标题' in rendered
	assert '标签1, 标签2' in rendered
	assert '这是提取的文本内容' in rendered
	assert '测试频道' in rendered
	assert '{title}' not in rendered
	assert '{original_tags}' not in rendered


def test_render_template_empty_tags(template_path: Path) -> None:
	"""测试空标签列表"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)
	template.load()

	rendered = template.render(
		title='测试标题', original_tags=[], extracted_text='文本内容', channel_name='测试频道'
	)

	assert '无' in rendered


def test_render_before_load(template_path: Path) -> None:
	"""测试在加载前渲染"""
	config = PromptTemplateConfig(template_path=template_path)
	template = PromptTemplate(config)

	with pytest.raises(ValueError, match='not loaded'):
		template.render(
			title='测试', original_tags=[], extracted_text='文本', channel_name='频道'
		)
