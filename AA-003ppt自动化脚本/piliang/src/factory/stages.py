from __future__ import annotations

from enum import Enum


class StageName(str, Enum):
	ingest = 'ingest'
	preflight = 'preflight'
	A = 'A'
	B = 'B'
	C = 'C'
	D = 'D'
	E = 'E'
	final_gate = 'final_gate'
	F = 'F'


class StageStatus(str, Enum):
	pending = 'pending'
	success = 'success'
	failed = 'failed'
	export_blocked = 'export_blocked'

