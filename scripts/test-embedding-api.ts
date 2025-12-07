#!/usr/bin/env node
/**
 * 测试向量生成 API
 */

import { generateEmbedding } from '@/lib/embedding';

async function testEmbeddingAPI() {
  console.log('🧪 测试向量生成 API...\n');

  const testCases = [
    '商业计划书PPT模板',
    'Business presentation template',
    '年终总结报告',
    'Marketing strategy deck',
  ];

  console.log('使用的环境变量:');
  console.log(
    '- OPENAI_API_KEY:',
    process.env.OPENAI_API_KEY ? '已配置' : '未配置'
  );
  console.log(
    '- OPENROUTER_API_KEY:',
    process.env.OPENROUTER_API_KEY ? '已配置' : '未配置'
  );
  console.log(
    '- SILICONFLOW_API_KEY:',
    process.env.SILICONFLOW_API_KEY ? '已配置' : '未配置'
  );
  console.log('');

  for (const text of testCases) {
    console.log(`测试文本: "${text}"`);

    try {
      const startTime = Date.now();
      const embedding = await generateEmbedding(text);
      const endTime = Date.now();

      if (embedding && embedding.length > 0) {
        console.log(`✅ 成功生成向量`);
        console.log(`   维度: ${embedding.length}`);
        console.log(`   耗时: ${endTime - startTime}ms`);
        console.log(
          `   前5个值: [${embedding
            .slice(0, 5)
            .map((v) => v.toFixed(4))
            .join(', ')}...]`
        );
      } else {
        console.log(`❌ 生成失败: 返回空向量`);
      }
    } catch (error: any) {
      console.log(`❌ 生成失败: ${error.message}`);
    }

    console.log('');
  }

  console.log('💡 提示:');
  console.log('1. 如果 API 返回 401，请检查 API key 是否正确');
  console.log('2. 如果 API 返回 429，说明达到了速率限制');
  console.log('3. 建议优先使用 SILICONFLOW_API_KEY（免费额度高）');
  console.log('4. 或者使用 OPENROUTER_API_KEY（支持多种模型）');
}

// 运行测试
testEmbeddingAPI().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});
