from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from factory.ai.ai_adapter import AIAdapter, AIAdapterConfig


def _mock_cli(prompt: Path, output: Path) -> None:
	data = json.loads(prompt.read_text(encoding='utf-8'))
	# echo back a minimal AI output.
	out = {
		'ai_summary': f"summary for {data.get('aid')}",
		'ai_keywords': ['k1', 'k2'],
		'ai_scenario': 'general',
		'ai_color_scheme': 'blue',
		'ai_structure_features': '3 sections',
		'ai_template_features': 'clean',
		'ppthub_category': 'general',
		'language': '中文',
	}
	output.write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')


def test_ai_adapter_runs_command(tmp_path: Path, monkeypatch: Any) -> None:
	prompt_path = tmp_path / 'prompt.json'
	prompt_path.write_text(json.dumps({'aid': '1'}), encoding='utf-8')
	output_path = tmp_path / 'out.json'

	# monkeypatch subprocess.run to call our mock cli.
	def fake_run(args, capture_output, text, timeout=None):  # noqa: ANN001
		assert prompt_path.as_posix() in args
		assert output_path.as_posix() in args
		_mock_cli(prompt_path, output_path)
		class R:
			returncode = 0
			stdout = ''
			stderr = ''
		return R()

	import subprocess  # noqa: WPS433

	monkeypatch.setattr(subprocess, 'run', fake_run)

	adapter = AIAdapter(AIAdapterConfig(command_template=['cli', '{prompt}', '{output}']))
	result = adapter.run(prompt_path, output_path)

	assert result['ai_summary'].startswith('summary for')
	assert result['ppthub_category'] == 'general'
