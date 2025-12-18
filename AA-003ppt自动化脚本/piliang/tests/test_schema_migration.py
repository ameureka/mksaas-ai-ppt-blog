"""
Schema 迁移测试
测试 AI Enrichment 相关的数据库 Schema 迁移
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest


@pytest.fixture
def db_connection(tmp_path: Path) -> sqlite3.Connection:
	"""创建测试数据库连接"""
	db_path = tmp_path / 'test.db'
	conn = sqlite3.connect(str(db_path))
	conn.row_factory = sqlite3.Row
	return conn


@pytest.fixture
def base_schema() -> str:
	"""基础 Schema（模拟迁移前的状态）"""
	return '''
	CREATE TABLE IF NOT EXISTS processed_assets (
		aid TEXT PRIMARY KEY,
		channel_id TEXT NOT NULL,
		title TEXT,
		original_tags TEXT,
		ai_summary TEXT,
		ai_keywords TEXT,
		ai_scenario TEXT,
		ai_color_scheme TEXT,
		ai_structure_features TEXT,
		ai_template_features TEXT,
		ppthub_category TEXT,
		language TEXT,
		stage_status TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		updated_at TEXT DEFAULT CURRENT_TIMESTAMP
	);
	'''


@pytest.fixture
def migration_002_ai_enrichment() -> list[str]:
	"""AI Enrichment 迁移脚本（返回 SQL 语句列表）"""
	return [
		'ALTER TABLE processed_assets ADD COLUMN tags_final TEXT',
		'ALTER TABLE processed_assets ADD COLUMN description_final TEXT',
		'ALTER TABLE processed_assets ADD COLUMN author TEXT',
		'ALTER TABLE processed_assets ADD COLUMN language_source TEXT',
		'ALTER TABLE processed_assets ADD COLUMN category_source TEXT',
		'ALTER TABLE processed_assets ADD COLUMN ai_fallback_reason TEXT',
		'ALTER TABLE processed_assets ADD COLUMN source_batch_id TEXT',
	]


def _apply_migration(cursor: sqlite3.Cursor, statements: list[str]) -> None:
	"""应用迁移语句"""
	for statement in statements:
		cursor.execute(statement)


class TestSchemaMigration:
	"""Schema 迁移测试"""

	def test_base_schema_creation(
		self, db_connection: sqlite3.Connection, base_schema: str
	) -> None:
		"""测试基础 Schema 创建"""
		cursor = db_connection.cursor()
		cursor.executescript(base_schema)
		db_connection.commit()

		# 验证表存在
		cursor.execute(
			"SELECT name FROM sqlite_master WHERE type='table' AND name='processed_assets'"
		)
		result = cursor.fetchone()
		assert result is not None
		assert result['name'] == 'processed_assets'

	def test_migration_002_adds_new_columns(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试迁移 002 添加新列"""
		cursor = db_connection.cursor()

		# 应用基础 Schema
		cursor.executescript(base_schema)
		db_connection.commit()

		# 应用迁移
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 验证新列存在
		cursor.execute("PRAGMA table_info(processed_assets)")
		columns = {row['name'] for row in cursor.fetchall()}

		expected_new_columns = {
			'tags_final',
			'description_final',
			'author',
			'language_source',
			'category_source',
			'ai_fallback_reason',
			'source_batch_id',
		}

		for col in expected_new_columns:
			assert col in columns, f'Column {col} not found after migration'

	def test_migration_preserves_existing_data(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试迁移保留现有数据"""
		cursor = db_connection.cursor()

		# 应用基础 Schema
		cursor.executescript(base_schema)
		db_connection.commit()

		# 插入测试数据
		cursor.execute(
			'''
			INSERT INTO processed_assets (aid, channel_id, title, ppthub_category, language)
			VALUES (?, ?, ?, ?, ?)
			''',
			('test-001', 'ppt_moban', '测试模板', 'business', '中文'),
		)
		db_connection.commit()

		# 应用迁移
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 验证数据保留
		cursor.execute('SELECT * FROM processed_assets WHERE aid = ?', ('test-001',))
		row = cursor.fetchone()

		assert row is not None
		assert row['aid'] == 'test-001'
		assert row['channel_id'] == 'ppt_moban'
		assert row['title'] == '测试模板'
		assert row['ppthub_category'] == 'business'
		assert row['language'] == '中文'

	def test_new_columns_accept_data(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试新列可以接受数据"""
		cursor = db_connection.cursor()

		# 应用基础 Schema 和迁移
		cursor.executescript(base_schema)
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 插入包含新列的数据
		cursor.execute(
			'''
			INSERT INTO processed_assets (
				aid, channel_id, title, ppthub_category, language,
				tags_final, description_final, author, language_source,
				category_source, ai_fallback_reason, source_batch_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			''',
			(
				'test-002',
				'ppt_moban',
				'测试模板2',
				'education',
				'中文',
				'["标签1", "标签2", "标签3"]',
				'这是一份教育类PPT模板，适合课堂教学使用。',
				'PPTHub',
				'rule',
				'ai',
				None,
				'batch-001',
			),
		)
		db_connection.commit()

		# 验证数据
		cursor.execute('SELECT * FROM processed_assets WHERE aid = ?', ('test-002',))
		row = cursor.fetchone()

		assert row is not None
		assert row['tags_final'] == '["标签1", "标签2", "标签3"]'
		assert row['description_final'] == '这是一份教育类PPT模板，适合课堂教学使用。'
		assert row['author'] == 'PPTHub'
		assert row['language_source'] == 'rule'
		assert row['category_source'] == 'ai'
		assert row['ai_fallback_reason'] is None
		assert row['source_batch_id'] == 'batch-001'

	def test_update_existing_record_with_new_columns(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试更新现有记录的新列"""
		cursor = db_connection.cursor()

		# 应用基础 Schema
		cursor.executescript(base_schema)
		db_connection.commit()

		# 插入测试数据
		cursor.execute(
			'''
			INSERT INTO processed_assets (aid, channel_id, title)
			VALUES (?, ?, ?)
			''',
			('test-003', 'ppt_moban', '测试模板3'),
		)
		db_connection.commit()

		# 应用迁移
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 更新新列
		cursor.execute(
			'''
			UPDATE processed_assets
			SET tags_final = ?, description_final = ?, language_source = ?
			WHERE aid = ?
			''',
			('["更新标签"]', '更新后的描述', 'ai', 'test-003'),
		)
		db_connection.commit()

		# 验证更新
		cursor.execute('SELECT * FROM processed_assets WHERE aid = ?', ('test-003',))
		row = cursor.fetchone()

		assert row['tags_final'] == '["更新标签"]'
		assert row['description_final'] == '更新后的描述'
		assert row['language_source'] == 'ai'


class TestSchemaIndexes:
	"""Schema 索引测试"""

	def test_create_indexes(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试创建索引"""
		cursor = db_connection.cursor()

		# 应用基础 Schema 和迁移
		cursor.executescript(base_schema)
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 创建索引
		cursor.execute(
			'CREATE INDEX IF NOT EXISTS idx_ppthub_category ON processed_assets(ppthub_category)'
		)
		cursor.execute(
			'CREATE INDEX IF NOT EXISTS idx_language ON processed_assets(language)'
		)
		cursor.execute(
			'CREATE INDEX IF NOT EXISTS idx_source_batch_id ON processed_assets(source_batch_id)'
		)
		db_connection.commit()

		# 验证索引存在
		cursor.execute(
			"SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='processed_assets'"
		)
		indexes = {row['name'] for row in cursor.fetchall()}

		assert 'idx_ppthub_category' in indexes
		assert 'idx_language' in indexes
		assert 'idx_source_batch_id' in indexes

	def test_index_improves_query(
		self, db_connection: sqlite3.Connection, base_schema: str
	) -> None:
		"""测试索引对查询的影响（功能测试）"""
		cursor = db_connection.cursor()

		# 应用基础 Schema
		cursor.executescript(base_schema)

		# 创建索引
		cursor.execute(
			'CREATE INDEX IF NOT EXISTS idx_ppthub_category ON processed_assets(ppthub_category)'
		)
		db_connection.commit()

		# 插入测试数据
		for i in range(100):
			category = ['business', 'education', 'general'][i % 3]
			cursor.execute(
				'''
				INSERT INTO processed_assets (aid, channel_id, title, ppthub_category)
				VALUES (?, ?, ?, ?)
				''',
				(f'test-{i:03d}', 'ppt_moban', f'模板{i}', category),
			)
		db_connection.commit()

		# 使用索引查询
		cursor.execute(
			'SELECT COUNT(*) as cnt FROM processed_assets WHERE ppthub_category = ?',
			('business',),
		)
		result = cursor.fetchone()

		# 验证查询结果正确
		assert result['cnt'] == 34  # 100 / 3 ≈ 33-34


class TestSchemaVersioning:
	"""Schema 版本管理测试"""

	def test_schema_version_table(self, db_connection: sqlite3.Connection) -> None:
		"""测试 Schema 版本表"""
		cursor = db_connection.cursor()

		# 创建版本表
		cursor.execute(
			'''
			CREATE TABLE IF NOT EXISTS schema_version (
				version INTEGER PRIMARY KEY,
				applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
				description TEXT
			)
			'''
		)
		db_connection.commit()

		# 插入版本记录
		cursor.execute(
			'''
			INSERT INTO schema_version (version, description)
			VALUES (?, ?)
			''',
			(1, 'Initial schema'),
		)
		cursor.execute(
			'''
			INSERT INTO schema_version (version, description)
			VALUES (?, ?)
			''',
			(2, 'AI Enrichment fields'),
		)
		db_connection.commit()

		# 查询当前版本
		cursor.execute('SELECT MAX(version) as current_version FROM schema_version')
		result = cursor.fetchone()

		assert result['current_version'] == 2

	def test_check_migration_needed(self, db_connection: sqlite3.Connection) -> None:
		"""测试检查是否需要迁移"""
		cursor = db_connection.cursor()

		# 创建版本表
		cursor.execute(
			'''
			CREATE TABLE IF NOT EXISTS schema_version (
				version INTEGER PRIMARY KEY,
				applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
				description TEXT
			)
			'''
		)

		# 插入版本 1
		cursor.execute(
			'INSERT INTO schema_version (version, description) VALUES (?, ?)',
			(1, 'Initial schema'),
		)
		db_connection.commit()

		# 检查是否需要迁移到版本 2
		cursor.execute('SELECT MAX(version) as current_version FROM schema_version')
		current_version = cursor.fetchone()['current_version']

		target_version = 2
		needs_migration = current_version < target_version

		assert needs_migration is True

	def test_idempotent_migration(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
	) -> None:
		"""测试幂等迁移（多次执行不报错）"""
		cursor = db_connection.cursor()

		# 应用基础 Schema
		cursor.executescript(base_schema)
		db_connection.commit()

		# 幂等添加列的 SQL（使用 try-except 模拟）
		new_columns = [
			('tags_final', 'TEXT'),
			('description_final', 'TEXT'),
			('language_source', 'TEXT'),
		]

		# 第一次添加
		for col_name, col_type in new_columns:
			try:
				cursor.execute(
					f'ALTER TABLE processed_assets ADD COLUMN {col_name} {col_type}'
				)
			except sqlite3.OperationalError:
				pass  # 列已存在
		db_connection.commit()

		# 第二次添加（应该不报错）
		for col_name, col_type in new_columns:
			try:
				cursor.execute(
					f'ALTER TABLE processed_assets ADD COLUMN {col_name} {col_type}'
				)
			except sqlite3.OperationalError:
				pass  # 列已存在
		db_connection.commit()

		# 验证列存在
		cursor.execute("PRAGMA table_info(processed_assets)")
		columns = {row['name'] for row in cursor.fetchall()}

		for col_name, _ in new_columns:
			assert col_name in columns


class TestFieldMergerPersistence:
	"""FieldMerger 持久化测试"""

	def test_persist_ai_enrichment_output(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试持久化 AI Enrichment 输出"""
		cursor = db_connection.cursor()

		# 应用 Schema
		cursor.executescript(base_schema)
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 模拟 FieldMerger 的持久化操作
		import json

		output_data = {
			'aid': 'persist-001',
			'ai_summary': '这是一份商务PPT模板',
			'ai_keywords': ['商务', '模板', '年终总结'],
			'ppthub_category': 'business',
			'language': '中文',
			'tags_final': ['商务', '模板', '年终总结', '工作汇报'],
			'description_final': '这是一份专业的商务PPT模板，适合年终总结和工作汇报使用。',
			'language_source': 'rule',
			'category_source': 'ai',
			'ai_fallback_reason': None,
		}

		cursor.execute(
			'''
			INSERT INTO processed_assets (
				aid, channel_id, ai_summary, ai_keywords, ppthub_category, language,
				tags_final, description_final, language_source, category_source,
				ai_fallback_reason, source_batch_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			''',
			(
				output_data['aid'],
				'ppt_moban',
				output_data['ai_summary'],
				json.dumps(output_data['ai_keywords'], ensure_ascii=False),
				output_data['ppthub_category'],
				output_data['language'],
				json.dumps(output_data['tags_final'], ensure_ascii=False),
				output_data['description_final'],
				output_data['language_source'],
				output_data['category_source'],
				output_data['ai_fallback_reason'],
				'test-batch',
			),
		)
		db_connection.commit()

		# 验证持久化结果
		cursor.execute('SELECT * FROM processed_assets WHERE aid = ?', ('persist-001',))
		row = cursor.fetchone()

		assert row is not None
		assert row['ai_summary'] == output_data['ai_summary']
		assert json.loads(row['ai_keywords']) == output_data['ai_keywords']
		assert row['ppthub_category'] == output_data['ppthub_category']
		assert row['language'] == output_data['language']
		assert json.loads(row['tags_final']) == output_data['tags_final']
		assert row['description_final'] == output_data['description_final']
		assert row['language_source'] == output_data['language_source']
		assert row['category_source'] == output_data['category_source']

	def test_batch_persist(
		self,
		db_connection: sqlite3.Connection,
		base_schema: str,
		migration_002_ai_enrichment: list[str],
	) -> None:
		"""测试批量持久化"""
		cursor = db_connection.cursor()

		# 应用 Schema
		cursor.executescript(base_schema)
		_apply_migration(cursor, migration_002_ai_enrichment)
		db_connection.commit()

		# 批量插入
		batch_data = [
			('batch-001', 'ppt_moban', 'business', '中文', 'rule'),
			('batch-002', 'ppt_moban', 'education', '中文', 'ai'),
			('batch-003', 'ppt_moban', 'general', 'English', 'fallback'),
		]

		cursor.executemany(
			'''
			INSERT INTO processed_assets (aid, channel_id, ppthub_category, language, category_source)
			VALUES (?, ?, ?, ?, ?)
			''',
			batch_data,
		)
		db_connection.commit()

		# 验证批量插入
		cursor.execute('SELECT COUNT(*) as cnt FROM processed_assets')
		result = cursor.fetchone()
		assert result['cnt'] == 3

		# 验证各条记录
		for aid, channel_id, category, language, source in batch_data:
			cursor.execute('SELECT * FROM processed_assets WHERE aid = ?', (aid,))
			row = cursor.fetchone()
			assert row is not None
			assert row['ppthub_category'] == category
			assert row['language'] == language
			assert row['category_source'] == source
