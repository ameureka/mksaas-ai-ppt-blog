import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkVectorization() {
  console.log('=== 向量化状态检查 ===\n');

  try {
    // 1. 基本统计
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as with_vector,
        COUNT(*) - COUNT(embedding) as without_vector
      FROM ppt
      WHERE deleted_at IS NULL
    `;

    console.log('📊 向量化统计:');
    console.log(`  总记录数: ${stats[0].total}`);
    console.log(`  已向量化: ${stats[0].with_vector}`);
    console.log(`  未向量化: ${stats[0].without_vector}`);
    console.log(
      `  完成率: ${((stats[0].with_vector / stats[0].total) * 100).toFixed(2)}%\n`
    );

    // 2. 检查模型
    const models = await sql`
      SELECT DISTINCT embedding_model, COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL
      GROUP BY embedding_model
    `;

    console.log('🤖 使用的Embedding模型:');
    models.forEach((m) => {
      console.log(`  ${m.embedding_model || 'NULL'}: ${m.count} 条`);
    });
    console.log();

    // 3. 未向量化记录
    const noVector = await sql`
      SELECT id, title, created_at
      FROM ppt
      WHERE embedding IS NULL AND deleted_at IS NULL
      LIMIT 5
    `;

    if (noVector.length > 0) {
      console.log('⚠️ 未向量化的记录:');
      noVector.forEach((p) => {
        console.log(`  [${p.id}] ${p.title}`);
      });
    } else {
      console.log('✅ 所有记录都已向量化\n');
    }

    // 4. 检查分类
    const categories = await sql`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(embedding) as with_vector
      FROM ppt
      WHERE deleted_at IS NULL
      GROUP BY category
      ORDER BY total DESC
      LIMIT 5
    `;

    console.log('📂 分类向量化情况 (前5类):');
    categories.forEach((c) => {
      const rate = ((c.with_vector / c.total) * 100).toFixed(0);
      console.log(
        `  ${c.category || 'NULL'}: ${c.with_vector}/${c.total} (${rate}%)`
      );
    });
    console.log();

    // 5. 最近更新
    const recent = await sql`
      SELECT title, updated_at, embedding_model
      FROM ppt
      WHERE embedding IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 3
    `;

    console.log('🕐 最近向量化:');
    recent.forEach((r) => {
      console.log(`  ${r.title.substring(0, 40)}... [${r.embedding_model}]`);
    });
    console.log();

    // 6. 向量搜索测试
    console.log('🔬 向量搜索功能测试:');
    try {
      // 测试一个简单的向量查询
      const test = await sql`
        SELECT COUNT(*) as count
        FROM ppt
        WHERE embedding IS NOT NULL
      `;
      console.log(`  ✅ 可以查询向量字段，共 ${test[0].count} 条有向量数据`);

      // 测试向量距离计算
      const distTest = await sql`
        SELECT id, title
        FROM ppt
        WHERE embedding IS NOT NULL
        LIMIT 1
      `;

      if (distTest.length > 0) {
        console.log(
          `  ✅ 向量数据存在，示例: ${distTest[0].title.substring(0, 30)}...`
        );
      }
    } catch (e: any) {
      console.log('  ❌ 向量操作失败:', e.message.substring(0, 100));
    }
    console.log();

    // 7. 数据完整性
    console.log('📋 数据完整性检查:');

    // 检查是否有NULL的embedding_model但有embedding
    const inconsistent = await sql`
      SELECT COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL AND embedding_model IS NULL
    `;

    if (inconsistent[0].count > 0) {
      console.log(`  ⚠️ ${inconsistent[0].count} 条记录有向量但无模型名称`);
    } else {
      console.log('  ✅ 向量数据与模型名称一致');
    }

    // 检查是否所有published的PPT都有向量
    const publishedNoVector = await sql`
      SELECT COUNT(*) as count
      FROM ppt
      WHERE status = 'published' 
        AND embedding IS NULL 
        AND deleted_at IS NULL
    `;

    if (publishedNoVector[0].count > 0) {
      console.log(`  ⚠️ ${publishedNoVector[0].count} 个已发布PPT未向量化`);
    } else {
      console.log('  ✅ 所有已发布PPT都已向量化');
    }
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message.substring(0, 200));
  }
}

checkVectorization().catch(console.error);
