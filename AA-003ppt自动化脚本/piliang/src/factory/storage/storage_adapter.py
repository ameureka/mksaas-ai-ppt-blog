from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from pathlib import Path

import boto3
from botocore.config import Config


@dataclass(frozen=True)
class StorageConfig:
	"""
	Storage configuration for S3-compatible services (AWS S3, Cloudflare R2, etc.).

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
		self._client = None

	def _get_client(self):
		"""Lazy-init S3 client."""
		if self._client is None:
			self._client = boto3.client(
				's3',
				endpoint_url=self._config.endpoint,
				aws_access_key_id=self._config.access_key_id,
				aws_secret_access_key=self._config.secret_access_key,
				region_name=self._config.region if self._config.region != 'auto' else 'us-east-1',
				config=Config(signature_version='s3v4'),
			)
		return self._client

	def compute_paths(self, *, category: str, aid: str) -> dict[str, str]:
		prefix = self._config.root_prefix.lstrip('/')
		if prefix and not prefix.endswith('/'):
			prefix = f'{prefix}/'

		pptx_path = f"{prefix}ppts/{category}/ppt_{aid}.pptx"
		# Default thumbnail extension is webp; WorkshopE may override based on cover file extension.
		thumb_path = f"{prefix}thumbs/{category}/ppt_{aid}.webp"
		preview_path = f"{prefix}previews/{category}/ppt_{aid}.webp"
		return {'pptx': pptx_path, 'thumb': thumb_path, 'preview': preview_path}

	def public_url(self, remote_path: str) -> str:
		base = self._config.public_base_url.rstrip('/')
		return f"{base}/{remote_path.lstrip('/')}"

	def upload(self, local_path: Path, remote_path: str) -> str:
		"""
		Upload a local file to remote storage and return the public URL.

		In dry_run mode, returns the computed URL without actual upload.
		"""
		if self._config.dry_run:
			return self.public_url(remote_path)

		# Real S3/R2 upload
		content_type, _ = mimetypes.guess_type(str(local_path))
		if content_type is None:
			suffix = local_path.suffix.lower()
			content_type = {
				'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'.webp': 'image/webp',
				'.jpg': 'image/jpeg',
				'.jpeg': 'image/jpeg',
				'.png': 'image/png',
			}.get(suffix, 'application/octet-stream')

		client = self._get_client()
		client.upload_file(
			str(local_path),
			self._config.bucket,
			remote_path,
			ExtraArgs={'ContentType': content_type},
		)
		return self.public_url(remote_path)
