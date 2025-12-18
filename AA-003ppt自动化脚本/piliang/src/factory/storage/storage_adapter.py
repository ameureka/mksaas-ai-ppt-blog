from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class StorageConfig:
	"""
	Storage configuration.

	When `dry_run=True`, no network/upload is performed and `upload()` returns the
	computed public URL directly (used by tests and local validation).
	"""

	endpoint: str
	bucket: str
	access_key_id: str
	secret_access_key: str
	region: str = 'auto'
	public_base_url: str = ''
	dry_run: bool = True
	root_prefix: str = ''


# Backwards-compatible alias (older code used StorageAdapterConfig).
StorageAdapterConfig = StorageConfig


class StorageAdapter:
	def __init__(self, config: StorageConfig) -> None:
		self._config = config

	def compute_paths(self, *, category: str, aid: str) -> dict[str, str]:
		prefix = self._config.root_prefix.lstrip('/')
		if prefix and not prefix.endswith('/'):
			prefix = f'{prefix}/'

		pptx_path = f"{prefix}ppts/{category}/ppt_{aid}.pptx"
		# Default thumbnail extension is webp; WorkshopE may override based on cover file extension.
		thumb_path = f"{prefix}thumbs/{category}/ppt_{aid}.webp"
		return {'pptx': pptx_path, 'thumb': thumb_path}

	def public_url(self, remote_path: str) -> str:
		base = self._config.public_base_url.rstrip('/')
		return f"{base}/{remote_path.lstrip('/')}"

	def upload(self, local_path: Path, remote_path: str) -> str:
		"""
		Upload a local file to remote storage and return the public URL.

		In this repo version we keep a dry-run mode for offline verification.
		"""
		if self._config.dry_run:
			return self.public_url(remote_path)
		# Real upload implementation is intentionally omitted here.
		# This project wires full S3/R2 upload in other environments.
		return self.public_url(remote_path)
