import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkVectorization() {
  console.log('=== 数据库向量化状态检查 ===\n');

  try {
    // 1. 检查总记录数和向量化情况
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as with_vector,
        COUNT(*) - COUNT(embedding) as without_vector
      FROM ppt
      WHERE deleted_at IS NULL
    `;

    console.log('📊 向量化统计:');
    console.log(`  - 总记录数: ${stats[0].total}`);
    console.log(`  - 已向量化: ${stats[0].with_vector}`);
    console.log(`  - 未向量化: ${stats[0].without_vector}`);
    console.log(
      `  - 完成率: ${((stats[0].with_vector / stats[0].total) * 100).toFixed(2)}%\n`
    );

    // 2. 检查使用的模型
    const models = await sql`
      SELECT DISTINCT embedding_model, COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL
      GROUP BY embedding_model
      ORDER BY count DESC
    `;

    console.log('🤖 使用的Embedding模型:');
    models.forEach((m) => {
      console.log(`  - ${m.embedding_model || 'NULL'}: ${m.count} 条`);
    });
    console.log();

    // 3. 检查向量维度
    const vectorDim = await sql`
      SELECT 
        id, title,
        array_length(embedding::text::text[], 1) as dimensions
      FROM ppt
      WHERE embedding IS NOT NULL
      LIMIT 5
    `;

    console.log('📐 向量维度检查 (前5条):');
    vectorDim.forEach((v) => {
      console.log(`  - ${v.title.substring(0, 30)}...: ${v.dimensions} 维`);
    });
    console.log();

    // 4. 检查未向量化的记录
    const noVector = await sql`
      SELECT id, title, created_at
      FROM ppt
      WHERE embedding IS NULL AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;

    if (noVector.length > 0) {
      console.log('⚠️ 未向量化的记录 (前10条):');
      noVector.forEach((p) => {
        console.log(`  - [${p.id}] ${p.title.substring(0, 40)}...`);
      });
      console.log();
    }

    // 5. 检查分类分布
    const categories = await sql`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(embedding) as with_vector
      FROM ppt
      WHERE deleted_at IS NULL
      GROUP BY category
      ORDER BY total DESC
      LIMIT 10
    `;

    console.log('📂 分类向量化情况 (前10类):');
    categories.forEach((c) => {
      const rate = ((c.with_vector / c.total) * 100).toFixed(1);
      console.log(
        `  - ${c.category || 'NULL'}: ${c.with_vector}/${c.total} (${rate}%)`
      );
    });
    console.log();

    // 6. 检查最近向量化时间
    const recentVectors = await sql`
      SELECT id, title, updated_at, embedding_model
      FROM ppt
      WHERE embedding IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 5
    `;

    console.log('🕐 最近向量化的记录:');
    recentVectors.forEach((r) => {
      const date = new Date(r.updated_at).toLocaleString('zh-CN');
      console.log(
        `  - ${date}: ${r.title.substring(0, 30)}... [${r.embedding_model}]`
      );
    });
    console.log();

    // 7. 检查索引
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'ppt'
        AND indexdef LIKE '%embedding%'
    `;

    console.log('🔍 向量索引:');
    if (indexes.length > 0) {
      indexes.forEach((idx) => {
        console.log(`  ✅ ${idx.indexname}`);
        console.log(`     ${idx.indexdef}`);
      });
    } else {
      console.log('  ⚠️ 未发现向量索引，建议创建以提升搜索性能');
    }
    console.log();

    // 8. 测试向量搜索
    console.log('🔬 测试向量搜索功能:');
    try {
      const testSearch = await sql`
        SELECT 
          id, title,
          embedding <=> embedding as self_distance
        FROM ppt
        WHERE embedding IS NOT NULL
        LIMIT 1
      `;

      if (testSearch.length > 0) {
        console.log('  ✅ 向量搜索功能正常');
        console.log(
          `  - 自相似度测试: ${testSearch[0].self_distance} (应该为0)`
        );
      }
    } catch (e: any) {
      console.log('  ❌ 向量搜索测试失败:', e.message);
    }
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkVectorization().catch(console.error);
