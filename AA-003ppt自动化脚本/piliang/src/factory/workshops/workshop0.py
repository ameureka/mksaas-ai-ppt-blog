from __future__ import annotations

import json
import shutil
import sqlite3
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from ..db.dao import ensure_batch, record_stage, upsert_raw_asset
from ..stages import StageName, StageStatus
from ..types import CandidateAsset, StageRecord, StandardInputPackage
from ..utils.pptx_selector import select_main_pptx


@dataclass(frozen=True)
class Workshop0Paths:
	downloads_root: Path
	crawler_db_path: Path


@dataclass(frozen=True)
class MergedAsset:
	aid: str
	primary_channel_id: str
	channel_ids: list[str]
	channel_names: list[str]
	detail_url: str | None
	original_tags: list[str]
	origin_updated_at: datetime | None
	file_path: Path | None
	cover_path: Path | None
	meta: dict[str, Any]


def _safe_parse_json(raw: str | None) -> dict[str, Any] | None:
	if not raw:
		return None
	try:
		data = json.loads(raw)
	except json.JSONDecodeError:
		return None
	return data if isinstance(data, dict) else None


def _resolve_download_archive(downloads_root: Path, channel_id: str, meta: dict[str, Any]) -> Path | None:
	aid = str(meta.get('aid') or '').strip()
	if not aid:
		return None

	channel_dir = downloads_root / channel_id
	if not channel_dir.exists():
		channel_dir = None

	candidates: list[Path] = []
	if channel_dir is not None:
		for ext in ('zip', 'rar', '7z'):
			candidates.extend(sorted(channel_dir.glob(f'{aid}-*.{ext}')))

		# Some sources may download as a plain pptx without an archive.
		candidates.extend(sorted(channel_dir.glob(f'{aid}-*.pptx')))

	if not candidates:
		meta_file_path = meta.get('filePath')
		if isinstance(meta_file_path, str) and meta_file_path.strip():
			p = Path(meta_file_path)
			return p if p.exists() else None
		return None

	def score(path: Path) -> tuple[int, str]:
		try:
			size = path.stat().st_size
		except OSError:
			size = -1
		return (size, path.name)

	# Deterministic selection: prefer the largest file, tie-break by name.
	return max(candidates, key=score)


def _resolve_cover_path(downloads_root: Path, channel_id: str, meta: dict[str, Any]) -> Path | None:
	aid = str(meta.get('aid') or '').strip()
	if not aid:
		return None

	images_dir = downloads_root / channel_id / 'images'
	if images_dir.exists():
		# Prefer jpg > jpeg > png, fallback to lexicographic.
		for ext in ('jpg', 'jpeg', 'png'):
			matches = sorted(images_dir.glob(f'{aid}-cover.{ext}'))
			if matches:
				return matches[0]

		matches = sorted(images_dir.glob(f'{aid}-cover.*'))
		if matches:
			return matches[0]

	meta_cover_path = meta.get('coverPath')
	if isinstance(meta_cover_path, str) and meta_cover_path.strip():
		p = Path(meta_cover_path)
		return p if p.exists() else None
	return None


def _dedupe_keep_order(items: list[str]) -> list[str]:
	seen: set[str] = set()
	out: list[str] = []
	for item in items:
		if item in seen:
			continue
		seen.add(item)
		out.append(item)
	return out


def _safe_size(path: Path) -> int:
	try:
		return path.stat().st_size
	except OSError:
		return -1


def _parse_updated_at(raw: Any) -> datetime | None:
	if not isinstance(raw, str):
		return None
	value = raw.strip()
	if not value:
		return None
	try:
		return datetime.fromisoformat(value)
	except ValueError:
		pass
	try:
		return datetime.strptime(value, '%Y-%m-%d')
	except ValueError:
		return None


class InvalidInputError(Exception):
	pass


def _format_dt_iso(value: datetime | None) -> str | None:
	if value is None:
		return None
	return value.isoformat(timespec='seconds')


def _safe_title(meta: dict[str, Any]) -> str:
	title = meta.get('title')
	return title.strip() if isinstance(title, str) else ''


def _safe_channel_name(meta: dict[str, Any], fallback: str) -> str:
	name = meta.get('channelName')
	if isinstance(name, str) and name.strip():
		return name.strip()
	return fallback


def _copy_if_missing(src: Path, dest: Path, *, overwrite: bool) -> None:
	if dest.exists() and not overwrite:
		return
	dest.parent.mkdir(parents=True, exist_ok=True)
	shutil.copyfile(src, dest)


def _write_json(path: Path, payload: dict[str, Any]) -> None:
	path.parent.mkdir(parents=True, exist_ok=True)
	tmp = path.with_name(f'{path.name}.tmp')
	tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
	tmp.replace(path)


def _iter_pptx_files(root: Path) -> list[Path]:
	if not root.exists():
		return []
	files = []
	for p in root.rglob('*.pptx'):
		if '__MACOSX' in p.parts:
			continue
		files.append(p)
	return files


def _find_extracted_dir(downloads_root: Path, channel_id: str, aid: str, file_path: Path | None) -> Path | None:
	if file_path is not None and file_path.suffix.lower() in {'.zip', '.rar', '.7z'}:
		candidate = file_path.with_suffix('')
		if candidate.exists() and candidate.is_dir():
			return candidate

	channel_dir = downloads_root / channel_id
	if not channel_dir.exists():
		return None
	dirs = sorted([p for p in channel_dir.glob(f'{aid}-*') if p.is_dir()])
	return dirs[0] if dirs else None


def _write_main_pptx_from_zip(zip_path: Path, dest_pptx: Path, *, aid: str, title: str) -> list[str]:
	warnings: list[str] = []
	with zipfile.ZipFile(zip_path) as zf:
		infos: list[zipfile.ZipInfo] = []
		for info in zf.infolist():
			name = info.filename
			if not name or name.endswith('/'):
				continue
			if not name.lower().endswith('.pptx'):
				continue
			if name.startswith('__MACOSX/'):
				continue
			infos.append(info)

		if not infos:
			raise InvalidInputError('zip 内未找到 .pptx 文件')

		if len(infos) > 1:
			warnings.append('WARN_MULTI_PPTX')

		aid_token = aid.strip()
		title_token = title.strip()

		def matches(info: zipfile.ZipInfo) -> bool:
			base = Path(info.filename).name
			if aid_token and aid_token in base:
				return True
			if title_token and title_token in base:
				return True
			return False

		candidates = [i for i in infos if matches(i)] or infos
		selected = max(candidates, key=lambda i: (i.file_size, Path(i.filename).name))

		dest_pptx.parent.mkdir(parents=True, exist_ok=True)
		with zf.open(selected) as src, open(dest_pptx, 'wb') as dst:
			shutil.copyfileobj(src, dst)

	return warnings


class Workshop0:
	def __init__(self, paths: Workshop0Paths) -> None:
		self._paths = paths

	def discover_assets(self, *, aids: set[str] | None = None) -> list[CandidateAsset]:
		"""
		Read `crawler.db` tasks and resolve local download paths under `downloads_root`.

		Only tasks with status='COMPLETED' are considered candidates.
		"""
		if not self._paths.crawler_db_path.exists():
			raise FileNotFoundError(f'crawler.db not found: {self._paths.crawler_db_path}')

		conn = sqlite3.connect(self._paths.crawler_db_path)
		conn.row_factory = sqlite3.Row
		try:
			params: list[str] = []
			query = "SELECT id, url, status, meta FROM tasks WHERE status = 'COMPLETED'"
			if aids:
				placeholders = ','.join('?' for _ in aids)
				query += f" AND CAST(json_extract(meta, '$.aid') AS TEXT) IN ({placeholders})"
				params.extend(sorted(aids))

			query += ' ORDER BY id'

			try:
				rows = conn.execute(query, params).fetchall()
			except sqlite3.OperationalError as exc:
				# SQLite builds without JSON1 extension won't have `json_extract`.
				# Fallback to a LIKE-based filter when aids are provided.
				if aids and 'json_extract' in str(exc):
					like_query = "SELECT id, url, status, meta FROM tasks WHERE status = 'COMPLETED'"
					like_params: list[str] = []
					like_placeholders = ' OR '.join('meta LIKE ?' for _ in aids)
					like_query += f' AND ({like_placeholders}) ORDER BY id'
					for aid in sorted(aids):
						like_params.append(f'%\"aid\":\"{aid}\"%')
					rows = conn.execute(like_query, like_params).fetchall()
				else:
					raise
		finally:
			conn.close()

		out: list[CandidateAsset] = []
		for row in rows:
			meta = _safe_parse_json(row['meta'])
			if meta is None:
				continue

			aid = str(meta.get('aid') or '').strip()
			channel_id = str(meta.get('channelId') or '').strip()
			if not aid or not channel_id:
				continue

			detail_url = meta.get('detailUrl') or row['url']
			if not isinstance(detail_url, str):
				detail_url = None

			file_path = _resolve_download_archive(self._paths.downloads_root, channel_id, meta)
			cover_path = _resolve_cover_path(self._paths.downloads_root, channel_id, meta)

			out.append(
				CandidateAsset(
					aid=aid,
					channel_id=channel_id,
					detail_url=detail_url,
					file_path=file_path,
					cover_path=cover_path,
					meta=meta,
				)
			)

		return out

	def merge_duplicates(self, candidates: list[CandidateAsset]) -> list[MergedAsset]:
		by_aid: dict[str, list[CandidateAsset]] = {}
		for c in candidates:
			by_aid.setdefault(c.aid, []).append(c)

		merged: list[MergedAsset] = []
		for aid, group in by_aid.items():
			sorted_group = sorted(
				group,
				key=lambda c: (
					c.channel_id,
					str(c.file_path or ''),
					str(c.detail_url or ''),
				),
			)

			channel_ids = _dedupe_keep_order([c.channel_id for c in sorted_group])
			channel_names = _dedupe_keep_order(
				[
					str(c.meta.get('channelName') or c.channel_id).strip()
					for c in sorted_group
				]
			)

			tags: list[str] = []
			for c in sorted_group:
				raw_tags = c.meta.get('tags') or []
				if isinstance(raw_tags, str):
					raw_tags = [raw_tags]
				if not isinstance(raw_tags, list):
					continue
				for t in raw_tags:
					tag = str(t).strip()
					if tag:
						tags.append(tag)
			original_tags = _dedupe_keep_order(tags)

			detail_urls = sorted({c.detail_url for c in sorted_group if c.detail_url})
			detail_url = detail_urls[0] if detail_urls else None

			updated_candidates = [_parse_updated_at(c.meta.get('updatedAt')) for c in sorted_group]
			updated_candidates = [d for d in updated_candidates if d is not None]
			origin_updated_at = max(updated_candidates) if updated_candidates else None

			file_candidates = [c for c in sorted_group if c.file_path and c.file_path.exists()]
			file_path = (
				max(file_candidates, key=lambda c: (_safe_size(c.file_path), str(c.file_path))).file_path
				if file_candidates
				else None
			)

			cover_candidates = [c for c in sorted_group if c.cover_path and c.cover_path.exists()]
			cover_path = (
				max(cover_candidates, key=lambda c: (_safe_size(c.cover_path), str(c.cover_path))).cover_path
				if cover_candidates
				else None
			)

			primary_channel_id = channel_ids[0] if channel_ids else sorted_group[0].channel_id
			if file_path is not None:
				for c in sorted_group:
					if c.file_path == file_path:
						primary_channel_id = c.channel_id
						break

			meta = dict(sorted_group[0].meta)
			meta['merged_channel_ids'] = channel_ids
			meta['merged_channel_names'] = channel_names
			meta['merged_original_tags'] = original_tags

			merged.append(
				MergedAsset(
					aid=aid,
					primary_channel_id=primary_channel_id,
					channel_ids=channel_ids,
					channel_names=channel_names,
					detail_url=detail_url,
					original_tags=original_tags,
					origin_updated_at=origin_updated_at,
					file_path=file_path,
					cover_path=cover_path,
					meta=meta,
				)
			)

		def sort_key(asset: MergedAsset) -> tuple[int, int | str]:
			try:
				return (0, int(asset.aid))
			except ValueError:
				return (1, asset.aid)

		return sorted(merged, key=sort_key)

	def persist_raw_assets(
		self,
		conn: sqlite3.Connection,
		*,
		source_batch_id: str,
		assets: list[MergedAsset],
	) -> None:
		for asset in assets:
			upsert_raw_asset(
				conn,
				aid=asset.aid,
				source_batch_id=source_batch_id,
				channel_ids=asset.channel_ids,
				channel_names=asset.channel_names,
				detail_url=asset.detail_url,
				original_tags=asset.original_tags,
				origin_updated_at=asset.origin_updated_at,
				file_path=asset.file_path,
				cover_path=asset.cover_path,
			)

	def build_standard_input_packages(
		self,
		conn: sqlite3.Connection,
		*,
		source_batch_id: str,
		assets: list[MergedAsset],
		output_root: Path,
		overwrite: bool = False,
	) -> list[StandardInputPackage]:
		ensure_batch(conn, source_batch_id=source_batch_id, input_root=str(output_root))

		packages: list[StandardInputPackage] = []
		for asset in assets:
			started_at = datetime.utcnow()
			warnings: list[str] = []
			artifacts: dict[str, Any] = {
				'output_root': str(output_root),
				'source_file_path': str(asset.file_path) if asset.file_path is not None else None,
			}
			stage_status = StageStatus.failed
			ingest_status = 'failed'
			error_code: str | None = None
			error_message: str | None = None

			try:
				channel_id = asset.primary_channel_id
				if not channel_id:
					raise InvalidInputError('缺失 channel_id')

				output_dir = output_root / channel_id / asset.aid
				meta_path = output_dir / 'meta.json'
				main_pptx_path = output_dir / 'main.pptx'
				cover_dest = output_dir / 'cover.jpg'

				title = _safe_title(asset.meta)
				channel_name = _safe_channel_name(asset.meta, asset.channel_names[0] if asset.channel_names else channel_id)

				meta_payload: dict[str, Any] = {
					'aid': asset.aid,
					'title': title,
					'channel_id': channel_id,
					'channel_name': channel_name,
					'original_tags': asset.original_tags,
					'detail_url': asset.detail_url,
					'origin_updated_at': _format_dt_iso(asset.origin_updated_at)
					or (asset.meta.get('updatedAt') if isinstance(asset.meta.get('updatedAt'), str) else None),
					'channel_ids': asset.channel_ids,
					'channel_names': asset.channel_names,
					'ratio': asset.meta.get('ratio'),
					'file_size_kb': asset.meta.get('fileSizeKB'),
					'attachment_type': asset.meta.get('attachmentType'),
					'download_links': asset.meta.get('downloadLinks') or asset.meta.get('downloadLink'),
				}
				_write_json(meta_path, meta_payload)

				if asset.cover_path is None or not asset.cover_path.exists():
					warnings.append('WARN_COVER_MISSING')
				else:
					_copy_if_missing(asset.cover_path, cover_dest, overwrite=overwrite)
					artifacts['cover_path'] = str(cover_dest)

				if main_pptx_path.exists() and main_pptx_path.stat().st_size > 0 and not overwrite:
					selected_warnings: list[str] = []
				else:
					file_path = asset.file_path
					extracted_dir = _find_extracted_dir(self._paths.downloads_root, channel_id, asset.aid, file_path)

					if extracted_dir is not None:
						pptx_files = _iter_pptx_files(extracted_dir)
						selection = select_main_pptx(pptx_files, aid=asset.aid, title=title)
						if selection is None:
							raise InvalidInputError('解压目录内未找到 .pptx 文件')
						selected_warnings = selection.warnings
						_copy_if_missing(selection.selected, main_pptx_path, overwrite=True)
						artifacts['selected_pptx_source'] = str(selection.selected)
					elif file_path is None or not file_path.exists():
						raise InvalidInputError('缺失原始下载文件')
					elif file_path.suffix.lower() == '.pptx':
						selected_warnings = []
						_copy_if_missing(file_path, main_pptx_path, overwrite=True)
						artifacts['selected_pptx_source'] = str(file_path)
					elif file_path.suffix.lower() == '.zip':
						selected_warnings = _write_main_pptx_from_zip(file_path, main_pptx_path, aid=asset.aid, title=title)
						artifacts['selected_pptx_source'] = f'zip:{file_path}'
					else:
						raise InvalidInputError(f'不支持的文件类型: {file_path.suffix}')

				warnings.extend([w for w in selected_warnings if w not in warnings])

				if not main_pptx_path.exists() or main_pptx_path.stat().st_size <= 0:
					raise InvalidInputError('main.pptx 生成失败')

				artifacts['input_dir'] = str(output_dir)
				artifacts['meta_path'] = str(meta_path)
				artifacts['main_pptx_path'] = str(main_pptx_path)

				pkg = StandardInputPackage(
					aid=asset.aid,
					channel_id=channel_id,
					root_dir=output_dir,
					main_pptx_path=main_pptx_path,
					meta_path=meta_path,
					cover_path=cover_dest if cover_dest.exists() else None,
				)
				packages.append(pkg)

				stage_status = StageStatus.success
				ingest_status = 'success'

			except InvalidInputError as exc:
				stage_status = StageStatus.failed
				ingest_status = 'invalid_input'
				error_code = 'INVALID_INPUT'
				error_message = str(exc)
			except Exception as exc:  # noqa: BLE001
				stage_status = StageStatus.failed
				ingest_status = 'failed'
				error_code = 'INGEST_FAILED'
				error_message = str(exc)
			finally:
				finished_at = datetime.utcnow()
				upsert_raw_asset(
					conn,
					aid=asset.aid,
					source_batch_id=source_batch_id,
					channel_ids=asset.channel_ids,
					channel_names=asset.channel_names,
					detail_url=asset.detail_url,
					original_tags=asset.original_tags,
					origin_updated_at=asset.origin_updated_at,
					file_path=asset.file_path,
					cover_path=asset.cover_path,
					ingest_status=ingest_status,
					ingest_error_code=error_code,
					ingest_error_message=error_message,
				)
				record_stage(
					conn,
					StageRecord(
						aid=asset.aid,
						stage=StageName.ingest,
						status=stage_status,
						started_at=started_at,
						finished_at=finished_at,
						error_code=error_code,
						error_message=error_message,
						warnings=warnings,
						artifacts=artifacts,
					),
				)

		return packages
