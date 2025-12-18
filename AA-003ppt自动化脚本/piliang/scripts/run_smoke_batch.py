#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import logging
import os
import shlex
import shutil
import sqlite3
import sys
from pathlib import Path

def _bootstrap_import_path() -> None:
	"""
	Prefer editable install (`pip install -e .`) so `factory` is importable.
	Fallback to local `src/` for direct execution.
	"""
	try:
		import factory  # noqa: F401
	except ImportError:
		sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))


_bootstrap_import_path()

from factory.config import load_factory_config
from factory.db.dao import ensure_batch, record_stage, upsert_raw_asset
from factory.db.init_db import init_db
from factory.gates import FinalGateValidator
from factory.gates.final_gate import apply_final_gate
from factory.gates.preflight import run_preflight
from factory.stages import StageName, StageStatus
from factory.types import PpthubInitItem, StageRecord, StandardInputPackage, CoverOutput
from factory.types import PackedOutput
from factory.storage.storage_adapter import StorageAdapter, StorageConfig, load_storage_config_from_env
from factory.workshops import (
	WorkshopA,
	WorkshopAConfig,
	WorkshopB,
	WorkshopBConfig,
	WorkshopD,
	WorkshopDConfig,
	WorkshopE,
	WorkshopF,
	WorkshopFConfig,
	run_clean,
	run_etl,
	run_pack,
	run_publish,
)
from factory.workshops.workshopC import WorkshopC, WorkshopCConfig, run_ai_enrich
from factory.workshops.workshop_cover import WorkshopCover, WorkshopCoverConfig, run_cover, CoverError


def setup_logging() -> None:
	"""配置日志系统"""
	level = os.environ.get('LOG_LEVEL', 'INFO').upper()
	logging.basicConfig(
		level=getattr(logging, level, logging.INFO),
		format='%(asctime)s [%(levelname)s] %(message)s',
		datefmt='%Y-%m-%d %H:%M:%S',
	)


logger = logging.getLogger(__name__)


def _create_fallback_cover_output(pkg: StandardInputPackage, output_dir: Path) -> CoverOutput | None:
	"""从原始封面创建 fallback CoverOutput"""
	if not pkg.cover_path or not pkg.cover_path.exists():
		return None
	target_dir = output_dir / pkg.channel_id
	target_dir.mkdir(parents=True, exist_ok=True)
	cover_ext = pkg.cover_path.suffix
	cover_path = target_dir / f'{pkg.aid}-cover{cover_ext}'
	shutil.copy2(pkg.cover_path, cover_path)
	return CoverOutput(
		aid=pkg.aid,
		channel_id=pkg.channel_id,
		cover_path=cover_path,
		preview_path=cover_path,
		source_slide=0,
	)


def main() -> None:
	setup_logging()
	parser = argparse.ArgumentParser(description='Run smoke batch for Piliang Factory')
	parser.add_argument('--manifest', required=True, help='Path to manifest json')
	parser.add_argument('--db', default=None, help='Path to sqlite db (default: data/assets_smoke.db)')
	parser.add_argument(
		'--from-stage',
		default=StageName.ingest.value,
		choices=[stage.value for stage in StageName],
		help='Start stage (defaults to ingest)',
	)
	parser.add_argument(
		'--to-stage',
		default=StageName.F.value,
		choices=[stage.value for stage in StageName],
		help='End stage (defaults to F: export)',
	)
	parser.add_argument('--dry-run', action='store_true', help='Dry run without execution')
	parser.add_argument('--public-base-url', default='https://cdn.example.com', help='Public base URL for publish step')
	parser.add_argument(
		'--enable-ai',
		action='store_true',
		help='Run Stage C (AI). Default off to avoid external calls.',
	)
	parser.add_argument(
		'--ai-command',
		default=None,
		help='Override AI command template, e.g. "gemini {prompt} {output}". Defaults to env AI_COMMAND_TEMPLATE.',
	)
	args = parser.parse_args()

	manifest_path = Path(args.manifest)
	manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
	batch_id = manifest['batch_id']

	stage_order = [
		StageName.ingest,
		StageName.preflight,
		StageName.A,
		StageName.B,
		StageName.C,
		StageName.COVER,
		StageName.D,
		StageName.E,
		StageName.final_gate,
		StageName.F,
	]
	from_stage = StageName(args.from_stage)
	to_stage = StageName(args.to_stage)
	from_idx = stage_order.index(from_stage)
	to_idx = stage_order.index(to_stage)

	def stage_enabled(target: StageName) -> bool:
		idx = stage_order.index(target)
		return from_idx <= idx <= to_idx

	cfg = load_factory_config()
	# AI command 解析（仅在 --enable-ai 时需要）
	ai_command_raw = args.ai_command or os.environ.get('AI_COMMAND_TEMPLATE', '')
	ai_command: list[str] = shlex.split(ai_command_raw) if ai_command_raw.strip() else []
	if args.enable_ai and not ai_command:
		raise SystemExit('Stage C enabled but AI command is empty. Set AI_COMMAND_TEMPLATE or --ai-command.')

	# 默认 db 路径放到 data/ 目录下
	db_path = Path(args.db) if args.db else (cfg.data_root / 'assets_smoke.db')
	init_db(db_path)
	conn = sqlite3.connect(db_path)
	conn.row_factory = sqlite3.Row
	try:
		ensure_batch(conn, source_batch_id=batch_id, input_root=str(manifest_path.parent))

		data_root = cfg.data_root
		output_root = cfg.data_root / 'output'
		brand_path = cfg.templates_dir / 'brand_end_slide.pptx'
		wa = WorkshopA(WorkshopAConfig(output_dir=output_root / 'etl'))
		wb = WorkshopB(
			WorkshopBConfig(
				output_dir=output_root / 'clean',
				forbidden_keywords=cfg.forbidden_keywords,
				brand_replacements=cfg.brand_replacements,
				brand_end_slide_path=brand_path if brand_path.exists() else None,
				head_prune_max=cfg.head_prune_max,
			)
		)
		wc = (
			WorkshopC(
				WorkshopCConfig(
					project_root=cfg.project_root,
					prompt_output_dir=output_root / 'ai_prompt',
					ai_output_dir=output_root / 'ai_output',
					ai_command=ai_command,
				)
			)
			if args.enable_ai
			else None
		)
		wd = WorkshopD(WorkshopDConfig(output_dir=output_root / 'final'))
		wcover = WorkshopCover(WorkshopCoverConfig(output_dir=output_root / 'cover'))
		# 从环境变量加载存储配置，支持真实上传
		storage_config = load_storage_config_from_env()
		# 如果命令行指定了 public_base_url 且环境变量未配置，使用命令行参数
		if not storage_config.public_base_url and args.public_base_url:
			storage_config = StorageConfig(
				endpoint=storage_config.endpoint,
				bucket=storage_config.bucket,
				access_key_id=storage_config.access_key_id,
				secret_access_key=storage_config.secret_access_key,
				region=storage_config.region,
				public_base_url=args.public_base_url,
				dry_run=storage_config.dry_run,
				path_templates=storage_config.path_templates,
			)
		storage = StorageAdapter(storage_config)
		we = WorkshopE(storage)
		wf = WorkshopF(WorkshopFConfig(output_dir=output_root / 'export'))

		results: list[PpthubInitItem] = []
		blocked: list[tuple[PpthubInitItem, str]] = []

		for entry in manifest.get('aids', []):
			aid = entry['aid']
			channel_id = entry['channel_id']
			raw_input_dir = Path(entry['input_dir'])
			if raw_input_dir.is_absolute() or raw_input_dir.exists():
				input_dir = raw_input_dir
			else:
				candidate = data_root / raw_input_dir
				input_dir = candidate if candidate.exists() else (manifest_path.parent / raw_input_dir)
			main = input_dir / 'main.pptx'
			meta_path = input_dir / 'meta.json'
			cover = input_dir / 'cover.jpg'
			meta = json.loads(meta_path.read_text(encoding='utf-8'))

			upsert_raw_asset(
				conn,
				aid=aid,
				source_batch_id=batch_id,
				channel_ids=[channel_id],
				channel_names=[channel_id],
				detail_url=meta.get('detail_url'),
				original_tags=meta.get('original_tags', []),
				file_path=main,
				cover_path=cover if cover.exists() else None,
			)

			pkg = StandardInputPackage(
				aid=aid,
				channel_id=channel_id,
				root_dir=input_dir,
				main_pptx_path=main,
				meta_path=meta_path,
				cover_path=cover if cover.exists() else None,
			)

			if args.dry_run:
				continue

			if stage_enabled(StageName.ingest):
				record_stage(
					conn,
					StageRecord(
						aid=aid,
						stage=StageName.ingest,
						status=StageStatus.success,
						warnings=[],
						artifacts={'input_dir': str(input_dir)},
					),
				)

			preflight_result = None
			if stage_enabled(StageName.preflight):
				preflight_result = run_preflight(conn, source_batch_id=batch_id, pkg=pkg)
				if preflight_result.status != StageStatus.success:
					logger.info(f'[skip] aid={aid} preflight failed: {preflight_result.error_message}')
					continue

			etl_out = run_etl(conn, source_batch_id=batch_id, pkg=pkg, workshop=wa) if stage_enabled(StageName.A) else None
			if etl_out is None:
				continue

			clean_out = run_clean(conn, source_batch_id=batch_id, etl_out=etl_out, workshop=wb) if stage_enabled(StageName.B) else None
			if clean_out is None:
				continue

			# AI 丰富结果
			ai_res = None
			if stage_enabled(StageName.C):
				if wc is None:
					logger.info(f'aid={aid} Stage C (AI) skipped (use --enable-ai to run)')
				else:
					ai_res = run_ai_enrich(conn, source_batch_id=batch_id, etl_out=etl_out, workshop=wc)
					category_source = ai_res.get('category_source', 'rule')
					logger.info(f"aid={aid} AI category={ai_res.get('ppthub_category')} source={category_source}")

			# Workshop Cover: 从清洗后的 PPTX 生成封面
			cover_out = None
			if stage_enabled(StageName.COVER) and clean_out:
				try:
					cover_out = run_cover(conn, source_batch_id=batch_id, clean_out=clean_out, workshop=wcover)
					logger.info(f'aid={aid} Cover generated: {cover_out.cover_path}')
				except CoverError as e:
					logger.warning(f'aid={aid} Cover generation failed: {e.code} - {e.message}')
					cover_out = _create_fallback_cover_output(pkg, output_root / 'cover')
					if cover_out:
						logger.info(f'aid={aid} Using fallback cover: {cover_out.cover_path}')
						record_stage(conn, StageRecord(
							aid=aid,
							stage=StageName.COVER,
							status=StageStatus.success,
							warnings=['WARN_COVER_FALLBACK'],
							artifacts={'fallback_source': str(pkg.cover_path)},
						))

			pack_out_dict = run_pack(conn, source_batch_id=batch_id, etl_out=etl_out, clean_out=clean_out, workshop=wd, cover_out=cover_out) if stage_enabled(StageName.D) else None
			if pack_out_dict is None:
				continue

			packed_out = PackedOutput(
				aid=aid,
				channel_id=channel_id,
				output_dir=pack_out_dict['pptx_path'].parent,
				pptx_path=pack_out_dict['pptx_path'],
				cover_path=pack_out_dict['cover_path'],
				ai_meta_path=None,
			)

			publish_out = run_publish(conn, source_batch_id=batch_id, packed_out=packed_out, workshop=we, category=ai_res.get('ppthub_category', 'general') if ai_res else 'general') if stage_enabled(StageName.E) else None

			file_url = publish_out['file_url_remote'] if publish_out else ''
			thumb_url = publish_out['thumbnail_url_remote'] if publish_out else ''
			
			# 从 AI 结果中提取丰富字段
			ai_meta = ai_res.get('ai_meta') if ai_res else None
			item = PpthubInitItem(
				id=f'ppt_{aid}',
				title=meta.get('title', ''),
				category=ai_res.get('ppthub_category', 'general') if ai_res else meta.get('category', 'general'),
				tags=ai_res.get('tags_final', meta.get('original_tags', [])) if ai_res else meta.get('original_tags', []),
				description=ai_res.get('description_final', '') if ai_res else '',
				language=ai_res.get('language', '中文') if ai_res else '中文',
				slides_count=etl_out.pages_count if hasattr(etl_out, 'pages_count') else 0,
				file_url=file_url,
				thumbnail_url=thumb_url,
				cover_image_url=thumb_url or None,
				file_size=(etl_out.file_size_kb * 1024) if hasattr(etl_out, 'file_size_kb') and etl_out.file_size_kb else None,
				# AI 丰富字段（用于向量化）
				ai_summary=ai_meta.ai_summary if ai_meta else None,
				ai_content_summary=ai_meta.ai_content_summary if ai_meta else None,
				ai_keywords=ai_meta.ai_keywords if ai_meta else None,
				ai_scenario=ai_meta.ai_scenario if ai_meta else None,
				ai_color_scheme=ai_meta.ai_color_scheme if ai_meta else None,
				ai_structure_features=ai_meta.ai_structure_features if ai_meta else None,
				ai_template_features=ai_meta.ai_template_features if ai_meta else None,
			)
			results.append(item)

		if args.dry_run:
			conn.commit()
			logger.info(f"[dry-run] manifest={manifest_path} batch_id={batch_id} staged {len(manifest.get('aids', []))} assets (no execution)")
			return

		if stage_enabled(StageName.final_gate):
			valid_categories = set(cfg.category_mapping_raw['categories'].keys()) if cfg.category_mapping_raw else {'general'}
			validator = FinalGateValidator(valid_categories=valid_categories)
			final_res = apply_final_gate(conn, source_batch_id=batch_id, items=results, validator=validator)
			blocked = final_res.blocked
			valid = final_res.valid
		else:
			valid = results

		if stage_enabled(StageName.F) and valid:
			json_path = wf.export_json(batch_id=batch_id, items=valid)
			csv_path = wf.export_csv(batch_id=batch_id, items=valid)
			report_path = wf.write_report(batch_id=batch_id, valid=valid, blocked=blocked)
			record_stage(
				conn,
				StageRecord(
					aid='*',
					stage=StageName.F,
					status=StageStatus.success,
					warnings=[],
					artifacts={
						'json_path': str(json_path),
						'csv_path': str(csv_path),
						'report_path': str(report_path),
						'valid_count': len(valid),
						'blocked_count': len(blocked),
					},
				),
			)

		conn.commit()
		logger.info(f"Smoke batch {batch_id} finished. valid={len(valid)} blocked={len(blocked)}")
	finally:
		conn.close()


if __name__ == '__main__':
	main()
