#!/usr/bin/env node

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function setupVectorDB() {
  console.log('🚀 开始设置向量数据库...\n');

  try {
    // 1. 启用 pgvector 扩展
    console.log('1️⃣  启用 pgvector 扩展...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('✅ pgvector 扩展已启用');

    // 2. 添加 embedding 字段到 ppt 表
    console.log('\n2️⃣  添加 embedding 字段到 ppt 表...');
    await db.execute(sql`
      ALTER TABLE ppt 
      ADD COLUMN IF NOT EXISTS embedding vector(1024)
    `);
    console.log('✅ embedding 字段已添加');

    // 3. 创建向量索引
    console.log('\n3️⃣  创建向量索引...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ppt_embedding_idx 
      ON ppt 
      USING hnsw (embedding vector_cosine_ops)
    `);
    console.log('✅ 向量索引已创建');

    // 4. 创建搜索日志表（如果不存在）
    console.log('\n4️⃣  确保搜索日志表存在...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS search_log (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        result_count INTEGER DEFAULT 0,
        clicked_id VARCHAR(255),
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 搜索日志表已准备');

    // 5. 创建搜索日志索引
    console.log('\n5️⃣  创建搜索日志索引...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_log_keyword 
      ON search_log(keyword)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_log_created_at 
      ON search_log(created_at DESC)
    `);
    console.log('✅ 搜索日志索引已创建');

    // 6. 验证设置
    console.log('\n6️⃣  验证数据库设置...');

    // 检查 pgvector 扩展
    const extResult = await db.execute(sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    if (extResult.rows.length > 0) {
      const ext = extResult.rows[0] as any;
      console.log(`✅ pgvector 版本: ${ext.extversion}`);
    }

    // 检查 embedding 字段
    const colResult = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ppt' 
      AND column_name = 'embedding'
    `);
    if (colResult.rows.length > 0) {
      console.log('✅ embedding 字段类型: vector(1024)');
    }

    // 检查索引
    const idxResult = await db.execute(sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'ppt' 
      AND indexname LIKE '%embedding%'
    `);
    if (idxResult.rows.length > 0) {
      console.log(`✅ 向量索引已创建: ${idxResult.rows.length} 个`);
    }

    // 统计 PPT 数据
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as with_embedding
      FROM ppt
    `);
    const stats = statsResult.rows[0] as any;
    console.log(`\n📊 PPT 数据统计:`);
    console.log(`   总数: ${stats.total}`);
    console.log(`   已有向量: ${stats.with_embedding}`);
    console.log(`   待生成: ${stats.total - stats.with_embedding}`);

    console.log('\n✨ 向量数据库设置完成！');
    console.log('\n下一步:');
    console.log('1. 运行 `pnpm generate-embeddings` 生成向量');
    console.log('2. 运行 `pnpm update-hot-keywords` 更新热词');
    console.log('3. 重启开发服务器 `pnpm dev`');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 设置失败:', error.message);

    if (error.code === '42710') {
      console.log('💡 提示: 扩展或索引可能已经存在，这是正常的');
    } else if (error.code === '42P07') {
      console.log('💡 提示: 表或字段可能已经存在，这是正常的');
    } else {
      console.log('\n调试信息:');
      console.log('错误代码:', error.code);
      console.log('错误详情:', error.detail);
      console.log('错误提示:', error.hint);
    }

    process.exit(1);
  }
}

// 运行设置
setupVectorDB();
