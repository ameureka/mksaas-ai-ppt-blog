from __future__ import annotations

from factory.storage.storage_adapter import StorageAdapter, StorageConfig


def test_property9_publish_path_and_url_determinism() -> None:
	config = StorageConfig(
		endpoint='',
		bucket='',
		access_key_id='',
		secret_access_key='',
		region='auto',
		public_base_url='https://cdn.example.com',
		dry_run=True,
	)
	adapter = StorageAdapter(config)
	paths = adapter.compute_paths(category='design', aid='999')
	assert paths['pptx'] == 'ppts/design/ppt_999.pptx'
	assert paths['thumb'] == 'thumbs/design/ppt_999.webp'
	assert adapter.public_url(paths['pptx']) == 'https://cdn.example.com/ppts/design/ppt_999.pptx'
	assert adapter.public_url(paths['thumb']) == 'https://cdn.example.com/thumbs/design/ppt_999.webp'
