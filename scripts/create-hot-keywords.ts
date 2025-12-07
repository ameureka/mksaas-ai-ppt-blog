import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function createHotKeywordsTable() {
  console.log('🔨 创建 hot_keywords 表...\n');

  try {
    // 创建表
    await sql`
      CREATE TABLE IF NOT EXISTS hot_keywords (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        search_count INTEGER DEFAULT 0,
        download_score NUMERIC DEFAULT 0,
        final_score NUMERIC DEFAULT 0,
        rank INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ 表创建成功');

    // 创建索引
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS hot_keywords_rank_idx 
      ON hot_keywords(rank)
    `;
    console.log('✅ 索引创建成功');

    // 验证
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename = 'hot_keywords'
    `;

    if (tables.length > 0) {
      console.log('✅ 验证成功: hot_keywords 表已存在');
    }
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
  }
}

createHotKeywordsTable().catch(console.error);
