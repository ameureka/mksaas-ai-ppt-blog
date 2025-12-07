import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkTables() {
  console.log('🔍 检查数据库表结构\n');

  try {
    // 获取所有表
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('📋 数据库中的表:');
    tables.forEach((t) => {
      console.log(`   - ${t.tablename}`);
    });

    // 检查搜索相关的表
    console.log('\n🔎 搜索系统相关表:');
    const searchTables = [
      'ppt',
      'search_log',
      'hot_keywords',
      'user_download_history',
      'ad_watch_record',
    ];

    for (const tableName of searchTables) {
      const exists = tables.some((t) => t.tablename === tableName);
      if (exists) {
        console.log(`   ✅ ${tableName} 存在`);

        // 获取记录数
        try {
          const count =
            await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
          console.log(`      记录数: ${count[0].count}`);
        } catch (e) {
          // 忽略错误
        }
      } else {
        console.log(`   ❌ ${tableName} 不存在`);
      }
    }

    // 检查 ppt 表的结构
    console.log('\n📊 PPT 表结构:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ppt'
      ORDER BY ordinal_position
    `;

    const importantColumns = [
      'embedding',
      'embedding_model',
      'deleted_at',
      'status',
    ];
    importantColumns.forEach((col) => {
      const column = columns.find((c) => c.column_name === col);
      if (column) {
        console.log(`   ✅ ${col}: ${column.data_type}`);
      } else {
        console.log(`   ❌ ${col}: 缺失`);
      }
    });
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkTables().catch(console.error);
