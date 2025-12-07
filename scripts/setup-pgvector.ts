#!/usr/bin/env node
/**
 * 设置 pgvector 扩展和向量字段
 * 运行: pnpm exec tsx scripts/setup-pgvector.ts
 */

import { getDb } from '@/db';
import { sql } from 'drizzle-orm';

async function setupPgVector() {
  console.log('🚀 开始设置 pgvector 数据库环境...\n');

  try {
    const db = await getDb();

    // 1. 启用 pgvector 扩展
    console.log('1️⃣  启用 pgvector 扩展...');
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
      console.log('✅ pgvector 扩展已启用');
    } catch (error: any) {
      if (
        error.code === 'XX000' &&
        error.message.includes('permission denied')
      ) {
        console.log('⚠️  没有权限创建扩展，可能需要在数据库控制台手动执行:');
        console.log('   CREATE EXTENSION IF NOT EXISTS vector;');
      } else if (error.code === '42710') {
        console.log('✅ pgvector 扩展已存在');
      } else {
        throw error;
      }
    }

    // 2. 添加 embedding 字段
    console.log('\n2️⃣  添加 embedding 字段到 ppt 表...');
    try {
      await db.execute(sql`
        ALTER TABLE ppt 
        ADD COLUMN embedding vector(1024),
        ADD COLUMN embedding_model VARCHAR(100)
      `);
      console.log('✅ embedding 字段已添加');
    } catch (error: any) {
      if (error.code === '42701') {
        console.log('✅ embedding 字段已存在');
      } else {
        throw error;
      }
    }

    // 3. 创建向量索引
    console.log('\n3️⃣  创建向量索引...');
    try {
      await db.execute(sql`
        CREATE INDEX ppt_embedding_idx 
        ON ppt 
        USING hnsw (embedding vector_cosine_ops)
      `);
      console.log('✅ 向量索引已创建');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('✅ 向量索引已存在');
      } else {
        throw error;
      }
    }

    // 4. 创建搜索日志表
    console.log('\n4️⃣  创建搜索日志表...');
    try {
      await db.execute(sql`
        CREATE TABLE search_log (
          id SERIAL PRIMARY KEY,
          keyword VARCHAR(255) NOT NULL,
          result_count INTEGER DEFAULT 0,
          clicked_id VARCHAR(255),
          user_id VARCHAR(255),
          session_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ 搜索日志表已创建');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('✅ 搜索日志表已存在');
      } else {
        throw error;
      }
    }

    // 5. 创建搜索日志索引
    console.log('\n5️⃣  创建搜索日志索引...');
    try {
      await db.execute(sql`
        CREATE INDEX idx_search_log_keyword 
        ON search_log(keyword)
      `);
      await db.execute(sql`
        CREATE INDEX idx_search_log_created_at 
        ON search_log(created_at DESC)
      `);
      console.log('✅ 搜索日志索引已创建');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('✅ 搜索日志索引已存在');
      } else {
        throw error;
      }
    }

    // 6. 验证设置
    console.log('\n6️⃣  验证数据库设置...');

    // 检查 pgvector 扩展
    const extResult = await db.execute(sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    if (extResult.rows && extResult.rows.length > 0) {
      const ext = extResult.rows[0] as any;
      console.log(`✅ pgvector 版本: ${ext.extversion}`);
    } else {
      console.log('⚠️  pgvector 扩展未安装');
    }

    // 检查 embedding 字段
    const colResult = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ppt' 
      AND column_name = 'embedding'
    `);
    if (colResult.rows && colResult.rows.length > 0) {
      console.log('✅ embedding 字段已存在');
    } else {
      console.log('⚠️  embedding 字段不存在');
    }

    // 统计 PPT 数据
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as with_embedding
      FROM ppt
    `);
    if (statsResult.rows && statsResult.rows.length > 0) {
      const stats = statsResult.rows[0] as any;
      console.log(`\n📊 PPT 数据统计:`);
      console.log(`   总数: ${stats.total}`);
      console.log(`   已有向量: ${stats.with_embedding}`);
      console.log(`   待生成: ${stats.total - stats.with_embedding}`);
    }

    console.log('\n✨ 数据库环境设置完成！');

    // 如果是 Neon 数据库，提供手动执行指南
    if (process.env.DATABASE_URL?.includes('neon.tech')) {
      console.log('\n📝 如果上述步骤中有权限问题，请在 Neon 控制台手动执行:');
      console.log('```sql');
      console.log('-- 1. 启用 pgvector 扩展');
      console.log('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('');
      console.log('-- 2. 添加向量字段');
      console.log(
        'ALTER TABLE ppt ADD COLUMN IF NOT EXISTS embedding vector(1024);'
      );
      console.log(
        'ALTER TABLE ppt ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);'
      );
      console.log('');
      console.log('-- 3. 创建向量索引');
      console.log(
        'CREATE INDEX IF NOT EXISTS ppt_embedding_idx ON ppt USING hnsw (embedding vector_cosine_ops);'
      );
      console.log('```');
    }

    console.log('\n下一步:');
    console.log('1. 运行 `pnpm generate-embeddings` 生成向量');
    console.log('2. 运行 `pnpm update-hot-keywords` 更新热词');
    console.log('3. 重启开发服务器 `pnpm dev`');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 设置失败:', error.message);

    console.log('\n调试信息:');
    console.log('错误代码:', error.code);
    console.log('错误详情:', error.detail);
    console.log('错误提示:', error.hint);

    console.log('\n💡 故障排除:');
    console.log('1. 确保 DATABASE_URL 环境变量已配置');
    console.log('2. 确保数据库用户有创建扩展的权限');
    console.log('3. 对于托管数据库，可能需要在控制台手动执行 SQL');

    process.exit(1);
  }
}

// 运行设置
setupPgVector();
