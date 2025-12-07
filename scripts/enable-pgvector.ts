import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function enable() {
  try {
    console.log('正在启用 pgvector 扩展...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('✅ pgvector 扩展已启用');

    // 验证
    const ext =
      await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
    console.log('版本:', ext[0]?.extversion || '未知');
  } catch (e: any) {
    console.log('❌ 启用失败:', e.message);
    console.log('请在 Neon 控制台手动启用');
  }
}
enable();
