from __future__ import annotations

from factory.storage.storage_adapter import StorageAdapter, StorageConfig


def test_storage_adapter_computes_paths_and_urls():
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
	paths = adapter.compute_paths(category='general', aid='123')
	assert paths['pptx'] == 'ppts/general/ppt_123.pptx'
	assert paths['thumb'] == 'thumbs/general/ppt_123.webp'
	assert adapter.public_url(paths['pptx']) == 'https://cdn.example.com/ppts/general/ppt_123.pptx'
