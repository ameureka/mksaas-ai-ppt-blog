import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function check() {
  try {
    const ext =
      await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
    if (ext.length > 0) {
      console.log('✅ pgvector 已启用:', ext[0].extversion);
    } else {
      console.log('❌ pgvector 未启用 - 需要在 Neon 控制台启用');
    }

    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ppt' AND column_name = 'embedding'
    `;
    if (cols.length > 0) {
      console.log('✅ ppt.embedding 列已存在');
    } else {
      console.log('⚠️ ppt.embedding 列不存在（Spec 01 会创建）');
    }

    const count = await sql`SELECT COUNT(*) as count FROM ppt`;
    console.log('📊 PPT 记录数:', count[0].count);
  } catch (e: any) {
    console.log('错误:', e.message);
  }
}
check();
