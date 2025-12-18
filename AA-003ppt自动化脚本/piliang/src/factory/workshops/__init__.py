"""
Workshops package exports.

Keep `Workshop0` importable without optional dependencies (e.g. `python-pptx`).
This enables running Workshop 0 (ingest) and related scripts in lightweight
environments.
"""

from importlib.util import find_spec

from .workshop0 import MergedAsset, Workshop0, Workshop0Paths
from .workshopA import WorkshopA, WorkshopAConfig, run_etl
from .workshopD import WorkshopD, WorkshopDConfig, run_pack
from .workshopE import WorkshopE, run_publish
from ..rules import RuleEngine, RuleEngineConfig
from ..storage.storage_adapter import StorageAdapter, StorageConfig, StorageAdapterConfig

__all__ = [
	'Workshop0',
	'Workshop0Paths',
	'MergedAsset',
	'WorkshopA',
	'WorkshopAConfig',
	'run_etl',
	'RuleEngine',
	'RuleEngineConfig',
	'WorkshopD',
	'WorkshopDConfig',
	'run_pack',
	'WorkshopE',
	'run_publish',
	'StorageAdapter',
	'StorageConfig',
	'StorageAdapterConfig',
]

if find_spec('pptx') is not None:
	from .workshopB import WorkshopB, WorkshopBConfig, run_clean
	from .workshopC import WorkshopC, WorkshopCConfig, run_ai_enrich
	from ..ai import AIAdapter, AIAdapterConfig, AiParser, ParsedAiMeta, PromptBuilder, PromptBuilderConfig

	__all__.extend(
		[
			'WorkshopB',
			'WorkshopBConfig',
			'run_clean',
			'WorkshopC',
			'WorkshopCConfig',
			'run_ai_enrich',
			'PromptBuilder',
			'PromptBuilderConfig',
			'AIAdapter',
			'AIAdapterConfig',
			'AiParser',
			'ParsedAiMeta',
		]
	)
