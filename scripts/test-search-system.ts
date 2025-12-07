import { hybridSearch } from '@/actions/ppt/search';
import { db } from '@/db';
import { ppt, searchLog } from '@/db/schema';
import { generateEmbedding } from '@/lib/embedding';
import { sql } from 'drizzle-orm';

async function testSearchSystem() {
  console.log('🧪 开始 PPT 搜索系统测试...\n');
  console.log('='.repeat(50));

  let passedTests = 0;
  let totalTests = 0;

  // 1. 测试数据库连接和 pgvector 扩展
  console.log('\n1️⃣  测试数据库连接和 pgvector 扩展...');
  totalTests++;
  try {
    const result = await db.execute(
      sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`
    );
    if (result.rows.length > 0) {
      console.log('✅ pgvector 扩展已启用');
      passedTests++;
    } else {
      console.log('⚠️  pgvector 扩展未启用，尝试创建...');
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
      console.log('✅ pgvector 扩展创建成功');
      passedTests++;
    }
  } catch (error: any) {
    console.error('❌ 数据库连接失败:', error.message);
  }

  // 2. 测试向量字段是否存在
  console.log('\n2️⃣  测试向量字段是否存在...');
  totalTests++;
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ppt' AND column_name = 'embedding'
    `);
    if (result.rows.length > 0) {
      console.log('✅ embedding 字段已存在');
      passedTests++;
    } else {
      console.log('⚠️  embedding 字段不存在，尝试添加...');
      await db.execute(
        sql`ALTER TABLE ppt ADD COLUMN IF NOT EXISTS embedding vector(1024)`
      );
      console.log('✅ embedding 字段添加成功');
      passedTests++;
    }
  } catch (error: any) {
    console.error('❌ 检查向量字段失败:', error.message);
  }

  // 3. 测试向量生成
  console.log('\n3️⃣  测试向量生成...');
  totalTests++;
  try {
    const testTexts = [
      '商业计划书PPT模板',
      'Business presentation template',
      '年终总结报告',
    ];

    for (const text of testTexts) {
      const startTime = Date.now();
      const embedding = await generateEmbedding(text);
      const endTime = Date.now();

      console.log(
        `   ✅ "${text}" - 维度: ${embedding.length}, 耗时: ${endTime - startTime}ms`
      );
    }
    passedTests++;
  } catch (error: any) {
    console.error('❌ 向量生成失败:', error.message);
    console.log(
      '   请确保已配置 OPENAI_API_KEY 或 OPENROUTER_API_KEY 或 SILICONFLOW_API_KEY'
    );
  }

  // 4. 测试混合搜索
  console.log('\n4️⃣  测试混合搜索功能...');
  totalTests++;
  try {
    const queries = [
      { query: '商业计划书', expectedFields: ['title', 'category', 'author'] },
      { query: 'business plan', expectedFields: ['title', 'description'] },
      { query: '年终总结', expectedFields: ['title', 'tags'] },
    ];

    for (const { query, expectedFields } of queries) {
      const startTime = Date.now();
      const results = await hybridSearch({
        query,
        limit: 5,
        useVector: true,
      });
      const endTime = Date.now();

      console.log(`   查询: "${query}"`);
      console.log(
        `   结果数: ${results.length}, 耗时: ${endTime - startTime}ms`
      );

      if (results.length > 0) {
        console.log(`   首个结果: ${results[0].title}`);
      }
    }
    passedTests++;
  } catch (error: any) {
    console.error('❌ 混合搜索失败:', error.message);
  }

  // 5. 测试搜索日志记录
  console.log('\n5️⃣  测试搜索日志记录...');
  totalTests++;
  try {
    // 插入测试日志
    await db.insert(searchLog).values({
      keyword: '测试搜索',
      resultCount: 10,
      userId: null,
      sessionId: 'test-session',
      createdAt: new Date(),
    });

    // 查询最近的日志
    const logs = await db
      .select()
      .from(searchLog)
      .orderBy(sql`created_at DESC`)
      .limit(5);

    console.log(`✅ 搜索日志记录成功，最近日志数: ${logs.length}`);

    if (logs.length > 0) {
      console.log(
        `   最新日志: 关键词="${logs[0].keyword}", 结果数=${logs[0].resultCount}`
      );
    }
    passedTests++;
  } catch (error: any) {
    console.error('❌ 搜索日志记录失败:', error.message);
  }

  // 6. 测试热门关键词统计
  console.log('\n6️⃣  测试热门关键词统计...');
  totalTests++;
  try {
    const hotKeywords = await db.execute(sql`
      SELECT 
        keyword,
        COUNT(*) as search_count,
        AVG(result_count) as avg_results
      FROM search_log
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY keyword
      ORDER BY search_count DESC
      LIMIT 10
    `);

    console.log(`✅ 热门关键词统计成功，热词数: ${hotKeywords.rows.length}`);

    if (hotKeywords.rows.length > 0) {
      console.log('   热门关键词 TOP 3:');
      hotKeywords.rows.slice(0, 3).forEach((row: any, index: number) => {
        console.log(
          `   ${index + 1}. "${row.keyword}" - 搜索次数: ${row.search_count}`
        );
      });
    }
    passedTests++;
  } catch (error: any) {
    console.error('❌ 热门关键词统计失败:', error.message);
  }

  // 7. 测试 PPT 数据完整性
  console.log('\n7️⃣  测试 PPT 数据完整性...');
  totalTests++;
  try {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_count,
        COUNT(embedding) as with_embedding,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT author) as authors
      FROM ppt
    `);

    const stat = stats.rows[0] as any;
    console.log(`✅ PPT 数据统计:`);
    console.log(`   总数: ${stat.total_count}`);
    console.log(`   已生成向量: ${stat.with_embedding}`);
    console.log(`   分类数: ${stat.categories}`);
    console.log(`   作者数: ${stat.authors}`);

    if (stat.with_embedding < stat.total_count) {
      console.log(
        `   ⚠️  有 ${stat.total_count - stat.with_embedding} 个 PPT 未生成向量`
      );
      console.log(`   建议运行: pnpm generate-embeddings`);
    }
    passedTests++;
  } catch (error: any) {
    console.error('❌ PPT 数据统计失败:', error.message);
  }

  // 测试总结
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);

  if (passedTests === totalTests) {
    console.log('✨ 所有测试通过！搜索系统运行正常。');
  } else {
    console.log(`⚠️  有 ${totalTests - passedTests} 个测试失败，请检查配置。`);
  }

  console.log('\n💡 后续建议:');
  console.log('1. 运行 `pnpm generate-embeddings` 为所有 PPT 生成向量');
  console.log('2. 运行 `pnpm update-hot-keywords` 更新热门关键词');
  console.log('3. 启动 `pnpm dev` 在浏览器中测试搜索界面');
  console.log('4. 使用 `pnpm db:studio` 查看数据库详情');

  process.exit(passedTests === totalTests ? 0 : 1);
}

// 运行测试
testSearchSystem().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
