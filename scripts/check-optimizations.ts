import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkOptimizations() {
  console.log('\n' + '='.repeat(60));
  console.log('           系统优化建议检查');
  console.log('='.repeat(60) + '\n');

  const suggestions = [];

  try {
    // 1. 检查向量索引详情
    console.log('1. 检查向量索引详情...');
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef,
        tablename
      FROM pg_indexes
      WHERE tablename = 'ppt'
        AND indexdef LIKE '%embedding%'
    `;

    if (indexes.length > 0) {
      console.log('   ✅ 已创建向量索引:');
      indexes.forEach((idx) => {
        console.log(`      ${idx.indexname}`);
        // 检查索引类型
        if (idx.indexdef.includes('ivfflat')) {
          console.log('      类型: IVFFlat (优化的向量索引)');
        } else if (idx.indexdef.includes('btree')) {
          console.log('      类型: B-tree (基础索引)');
          suggestions.push('建议创建 IVFFlat 索引以提升向量搜索性能');
        }
      });
    } else {
      console.log('   ⚠️ 未发现向量索引');
      suggestions.push('强烈建议创建向量索引以提升搜索性能');
    }

    // 2. 检查数据完整性
    console.log('\n2. 检查数据完整性...');

    // 检查 NULL embeddings
    const nullEmbeddings = await sql`
      SELECT COUNT(*) as count
      FROM ppt
      WHERE deleted_at IS NULL 
        AND embedding IS NULL
    `;

    if (nullEmbeddings[0].count > 0) {
      console.log(`   ⚠️ ${nullEmbeddings[0].count} 条记录缺少向量`);
      suggestions.push(`需要为 ${nullEmbeddings[0].count} 条记录生成向量`);
    } else {
      console.log('   ✅ 所有记录都有向量数据');
    }

    // 检查模型一致性
    const modelConsistency = await sql`
      SELECT 
        embedding_model,
        COUNT(*) as count
      FROM ppt
      WHERE embedding IS NOT NULL
      GROUP BY embedding_model
    `;

    if (modelConsistency.length > 1) {
      console.log('   ⚠️ 使用了多个不同的模型:');
      modelConsistency.forEach((m) => {
        console.log(`      ${m.embedding_model}: ${m.count} 条`);
      });
      suggestions.push('建议统一使用同一个模型以保证搜索质量');
    } else {
      console.log(`   ✅ 模型使用一致: ${modelConsistency[0].embedding_model}`);
    }

    // 3. 检查搜索日志表
    console.log('\n3. 检查搜索日志表...');
    const searchLogCount = await sql`
      SELECT COUNT(*) as count FROM search_log
    `;
    console.log(`   搜索日志记录数: ${searchLogCount[0].count}`);

    if (searchLogCount[0].count === 0) {
      console.log('   ℹ️ 暂无搜索日志，系统开始使用后会自动记录');
    }

    // 4. 检查热词表
    console.log('\n4. 检查热词缓存...');
    const hotKeywordsCount = await sql`
      SELECT COUNT(*) as count FROM hot_keywords
    `;
    console.log(`   热词数量: ${hotKeywordsCount[0].count}`);

    if (hotKeywordsCount[0].count === 0) {
      suggestions.push('可以运行 pnpm update-hot-keywords 生成热词缓存');
    }

    // 5. 检查表大小和性能
    console.log('\n5. 检查表大小和性能指标...');
    const tableSize = await sql`
      SELECT 
        pg_size_pretty(pg_total_relation_size('ppt')) as total_size,
        pg_size_pretty(pg_relation_size('ppt')) as table_size,
        pg_size_pretty(pg_indexes_size('ppt')) as indexes_size
    `;

    console.log(`   表总大小: ${tableSize[0].total_size}`);
    console.log(`   数据大小: ${tableSize[0].table_size}`);
    console.log(`   索引大小: ${tableSize[0].indexes_size}`);

    // 6. 测试向量搜索性能
    console.log('\n6. 测试向量搜索性能...');
    const startTime = Date.now();

    // 获取一个样本向量
    const sampleVector = await sql`
      SELECT embedding
      FROM ppt
      WHERE embedding IS NOT NULL
      LIMIT 1
    `;

    if (sampleVector.length > 0) {
      // 执行一个向量搜索
      const searchStart = Date.now();
      await sql`
        SELECT id, title
        FROM ppt
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${sampleVector[0].embedding}
        LIMIT 10
      `;
      const searchTime = Date.now() - searchStart;

      console.log(`   向量搜索耗时: ${searchTime}ms`);

      if (searchTime > 500) {
        console.log('   ⚠️ 搜索速度较慢');
        suggestions.push('搜索性能需要优化，建议创建向量索引');
      } else if (searchTime > 100) {
        console.log('   ⚠️ 搜索速度一般');
      } else {
        console.log('   ✅ 搜索速度良好');
      }
    }

    // 7. 检查是否有重复的PPT
    console.log('\n7. 检查数据重复性...');
    const duplicates = await sql`
      SELECT 
        title,
        COUNT(*) as count
      FROM ppt
      WHERE deleted_at IS NULL
      GROUP BY title
      HAVING COUNT(*) > 1
      LIMIT 5
    `;

    if (duplicates.length > 0) {
      console.log('   ⚠️ 发现重复的标题:');
      duplicates.forEach((d) => {
        console.log(`      "${d.title}": ${d.count} 条`);
      });
      suggestions.push('建议检查并清理重复数据');
    } else {
      console.log('   ✅ 未发现重复标题');
    }
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }

  // 输出优化建议
  console.log('\n' + '='.repeat(60));
  console.log('           优化建议总结');
  console.log('='.repeat(60));

  if (suggestions.length === 0) {
    console.log('\n🎉 太棒了！系统已经优化到最佳状态！');
  } else {
    console.log(`\n发现 ${suggestions.length} 个优化建议:\n`);
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

checkOptimizations().catch(console.error);
