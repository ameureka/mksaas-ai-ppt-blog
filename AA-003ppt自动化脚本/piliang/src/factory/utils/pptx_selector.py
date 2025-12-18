from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class MainPptxSelection:
	selected: Path
	warnings: list[str]


def _safe_size(path: Path) -> int:
	try:
		return path.stat().st_size
	except OSError:
		return -1


def select_main_pptx(
	pptx_files: list[Path],
	*,
	aid: str | None = None,
	title: str | None = None,
) -> MainPptxSelection | None:
	"""
	Select a single main PPTX file from a directory containing multiple PPTX files.

	Deterministic rule:
	1) Prefer filenames containing `aid` or `title`
	2) Otherwise choose the largest file
	3) If size cannot be read for all candidates, choose the first file by name
	"""
	normalized = [p for p in pptx_files if p.suffix.lower() == '.pptx']
	if not normalized:
		return None

	warnings: list[str] = []
	if len(normalized) > 1:
		warnings.append('WARN_MULTI_PPTX')

	aid_token = (aid or '').strip()
	title_token = (title or '').strip()

	def matches(path: Path) -> bool:
		name = path.name
		if aid_token and aid_token in name:
			return True
		if title_token and title_token in name:
			return True
		return False

	candidates = [p for p in normalized if matches(p)]
	if not candidates:
		candidates = list(normalized)

	# Prefer the largest file; tie-break by name to keep it deterministic.
	with_sizes = [(p, _safe_size(p)) for p in candidates]
	if any(size >= 0 for _, size in with_sizes):
		selected = max(with_sizes, key=lambda pair: (pair[1], pair[0].name))[0]
	else:
		selected = sorted(candidates, key=lambda p: p.name)[0]

	return MainPptxSelection(selected=selected, warnings=warnings)

