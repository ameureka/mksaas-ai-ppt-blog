import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function verifyVectorization() {
  console.log('\n' + '='.repeat(60));
  console.log('           向量化验证报告');
  console.log('='.repeat(60) + '\n');

  const results = {
    passed: [] as string[],
    warnings: [] as string[],
    errors: [] as string[],
  };

  try {
    // 1. 检查pgvector扩展
    console.log('1. 检查 pgvector 扩展...');
    const ext =
      await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
    if (ext.length > 0) {
      results.passed.push(`pgvector ${ext[0].extversion} 已启用`);
      console.log(`   ✅ pgvector ${ext[0].extversion} 已启用`);
    } else {
      results.errors.push('pgvector 扩展未启用');
      console.log('   ❌ pgvector 扩展未启用');
    }

    // 2. 检查向量化覆盖率
    console.log('\n2. 检查向量化覆盖率...');
    const coverage = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as vectorized,
        COUNT(CASE WHEN embedding IS NULL THEN 1 END) as not_vectorized
      FROM ppt
      WHERE deleted_at IS NULL
    `;

    const rate = ((coverage[0].vectorized / coverage[0].total) * 100).toFixed(
      2
    );
    console.log(`   总记录: ${coverage[0].total}`);
    console.log(`   已向量化: ${coverage[0].vectorized}`);
    console.log(`   未向量化: ${coverage[0].not_vectorized}`);
    console.log(`   覆盖率: ${rate}%`);

    if (rate === '100.00') {
      results.passed.push(`向量化覆盖率 100%`);
      console.log('   ✅ 完美！所有记录都已向量化');
    } else if (Number(rate) >= 95) {
      results.warnings.push(`向量化覆盖率 ${rate}%`);
      console.log(`   ⚠️ 向量化覆盖率良好但不完整: ${rate}%`);
    } else {
      results.errors.push(`向量化覆盖率仅 ${rate}%`);
      console.log(`   ❌ 向量化覆盖率过低: ${rate}%`);
    }

    // 3. 检查模型一致性
    console.log('\n3. 检查模型一致性...');
    const models = await sql`
      SELECT embedding_model, COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL
      GROUP BY embedding_model
      ORDER BY count DESC
    `;

    console.log('   使用的模型:');
    models.forEach((m) => {
      console.log(`   - ${m.embedding_model}: ${m.count} 条`);
    });

    if (models.length === 1) {
      results.passed.push(`模型一致: ${models[0].embedding_model}`);
      console.log('   ✅ 模型使用一致');
    } else if (models.length > 1) {
      results.warnings.push(`使用了 ${models.length} 种不同模型`);
      console.log('   ⚠️ 使用了多种模型，建议统一');
    }

    // 4. 检查向量化时间分布
    console.log('\n4. 检查向量化时间分布...');
    const timeDistribution = await sql`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL
      GROUP BY DATE(updated_at)
      ORDER BY date DESC
      LIMIT 5
    `;

    console.log('   最近向量化日期:');
    timeDistribution.forEach((t) => {
      console.log(`   - ${t.date}: ${t.count} 条`);
    });

    // 5. 检查分类向量化情况
    console.log('\n5. 检查分类向量化情况...');
    const categoryStats = await sql`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(embedding) as vectorized,
        ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2) as rate
      FROM ppt
      WHERE deleted_at IS NULL
      GROUP BY category
      ORDER BY total DESC
    `;

    let allCategoriesComplete = true;
    console.log('   分类统计:');
    categoryStats.forEach((c) => {
      const icon = c.rate == 100 ? '✅' : c.rate >= 95 ? '⚠️' : '❌';
      console.log(
        `   ${icon} ${c.category || 'NULL'}: ${c.vectorized}/${c.total} (${c.rate}%)`
      );
      if (c.rate < 100) allCategoriesComplete = false;
    });

    if (allCategoriesComplete) {
      results.passed.push('所有分类都已完全向量化');
    }

    // 6. 随机抽样测试向量数据
    console.log('\n6. 随机抽样测试向量数据...');
    const samples = await sql`
      SELECT id, title, embedding IS NOT NULL as has_vector
      FROM ppt
      WHERE deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT 10
    `;

    let allSamplesHaveVector = true;
    console.log('   随机样本 (10条):');
    samples.forEach((s) => {
      const icon = s.has_vector ? '✓' : '✗';
      console.log(`   ${icon} ${s.title.substring(0, 40)}...`);
      if (!s.has_vector) allSamplesHaveVector = false;
    });

    if (allSamplesHaveVector) {
      results.passed.push('随机样本测试通过');
    }

    // 7. 检查是否有索引
    console.log('\n7. 检查向量索引...');
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'ppt'
        AND indexdef LIKE '%embedding%'
    `;

    if (indexes.length > 0) {
      results.passed.push(`发现 ${indexes.length} 个向量索引`);
      console.log(`   ✅ 发现 ${indexes.length} 个向量索引`);
      indexes.forEach((idx) => {
        console.log(`      - ${idx.indexname}`);
      });
    } else {
      results.warnings.push('未发现向量索引');
      console.log('   ⚠️ 未发现向量索引，可能影响搜索性能');
    }
  } catch (error: any) {
    results.errors.push(`检查失败: ${error.message}`);
    console.error('\n❌ 检查过程出错:', error.message);
  }

  // 输出总结
  console.log('\n' + '='.repeat(60));
  console.log('                验证总结');
  console.log('='.repeat(60));

  console.log(`\n✅ 通过项 (${results.passed.length}):`);
  results.passed.forEach((item) => console.log(`   • ${item}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  警告项 (${results.warnings.length}):`);
    results.warnings.forEach((item) => console.log(`   • ${item}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ 错误项 (${results.errors.length}):`);
    results.errors.forEach((item) => console.log(`   • ${item}`));
  }

  // 最终判定
  console.log('\n' + '='.repeat(60));
  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log('🎉 完美！向量化完全符合预期！');
  } else if (results.errors.length === 0) {
    console.log('👍 良好！向量化基本符合预期，有少量可优化项。');
  } else {
    console.log('⚠️  向量化存在问题，需要处理。');
  }
  console.log('='.repeat(60) + '\n');

  // 返回是否符合预期
  return results.errors.length === 0;
}

verifyVectorization()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('验证失败:', error);
    process.exit(1);
  });
