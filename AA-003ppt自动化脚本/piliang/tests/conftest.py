from __future__ import annotations

import sys
from pathlib import Path


def pytest_configure() -> None:
	# Ensure `AA-003ppt自动化脚本/piliang/src` is importable as a package root.
	project_root = Path(__file__).resolve().parents[1]
	src_dir = project_root / 'src'
	sys.path.insert(0, str(src_dir))

