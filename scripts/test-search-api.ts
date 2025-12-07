#!/usr/bin/env node

import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3005';

// 测试搜索 API
async function testSearchAPIs() {
  console.log('🧪 开始 PPT 搜索 API 测试...');
  console.log(`📍 目标服务器: ${BASE_URL}`);
  console.log('='.repeat(50));

  // 检查服务器是否运行
  try {
    const pingResponse = await fetch(`${BASE_URL}/api/ping`);
    if (!pingResponse.ok) {
      console.error('❌ 服务器未运行，请先运行: pnpm dev');
      process.exit(1);
    }
    console.log('✅ 服务器运行正常\n');
  } catch (error) {
    console.error('❌ 无法连接到服务器，请先运行: pnpm dev');
    process.exit(1);
  }

  const tests = [
    {
      name: '1️⃣  获取热门关键词',
      method: 'GET',
      url: '/api/hot-keywords',
      expectedStatus: 200,
    },
    {
      name: '2️⃣  搜索建议 API',
      method: 'GET',
      url: '/api/search/suggestions?q=商业',
      expectedStatus: 200,
    },
    {
      name: '3️⃣  基础文本搜索',
      method: 'POST',
      url: '/api/ppts',
      body: {
        search: '商业计划书',
        page: 1,
        pageSize: 10,
      },
      expectedStatus: 200,
    },
    {
      name: '4️⃣  分类筛选搜索',
      method: 'POST',
      url: '/api/ppts',
      body: {
        search: '',
        category: 'business',
        page: 1,
        pageSize: 10,
      },
      expectedStatus: 200,
    },
    {
      name: '5️⃣  空关键词搜索（返回全部）',
      method: 'POST',
      url: '/api/ppts',
      body: {
        search: '',
        page: 1,
        pageSize: 10,
      },
      expectedStatus: 200,
    },
    {
      name: '6️⃣  测试搜索埋点',
      method: 'POST',
      url: '/api/search/click',
      body: {
        keyword: '测试关键词',
        pptId: 'test-id-123',
      },
      expectedStatus: 200,
    },
    {
      name: '7️⃣  测试不存在的关键词',
      method: 'POST',
      url: '/api/ppts',
      body: {
        search: 'xyz123notexist',
        page: 1,
        pageSize: 10,
      },
      expectedStatus: 200,
    },
  ];

  let passedTests = 0;
  const results = [];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`${BASE_URL}${test.url}`, options);
      const endTime = performance.now();
      const responseTime = (endTime - startTime).toFixed(2);

      const data = await response.json();

      if (response.status === test.expectedStatus) {
        console.log(
          `✅ 状态码: ${response.status}, 响应时间: ${responseTime}ms`
        );

        // 显示返回数据摘要
        if (data.ppts) {
          console.log(`   返回 PPT 数: ${data.ppts.length}`);
          if (data.ppts.length > 0) {
            console.log(`   首个结果: ${data.ppts[0].title}`);
          }
        } else if (data.keywords) {
          console.log(`   热门关键词数: ${data.keywords.length}`);
        } else if (data.suggestions) {
          console.log(`   搜索建议数: ${data.suggestions.length}`);
        } else if (data.success !== undefined) {
          console.log(`   操作结果: ${data.success ? '成功' : '失败'}`);
        } else if (data.message) {
          console.log(`   消息: ${data.message}`);
        }

        passedTests++;
        results.push({
          name: test.name,
          passed: true,
          responseTime,
        });
      } else {
        console.log(
          `❌ 状态码: ${response.status} (期望: ${test.expectedStatus})`
        );
        console.log(`   错误信息: ${data.error || data.message || '未知错误'}`);
        results.push({
          name: test.name,
          passed: false,
          responseTime,
          error: data.error || data.message,
        });
      }
    } catch (error: any) {
      console.log(`❌ 请求失败: ${error.message}`);
      results.push({
        name: test.name,
        passed: false,
        error: error.message,
      });
    }
  }

  // 性能基准测试
  console.log('\n' + '='.repeat(50));
  console.log('\n⚡ 性能基准测试');

  const performanceQueries = [
    '商业计划书',
    'business plan',
    '年终总结PPT',
    '教育培训模板',
    'marketing presentation',
  ];

  console.log('\n搜索性能测试:');
  for (const query of performanceQueries) {
    const start = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/ppts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: query,
          page: 1,
          pageSize: 10,
        }),
      });

      const data = await response.json();
      const end = performance.now();
      const time = (end - start).toFixed(2);

      console.log(
        `  "${query}": ${time}ms (结果数: ${data.ppts?.length || 0})`
      );
    } catch (error) {
      console.log(`  "${query}": 失败`);
    }
  }

  // 测试总结
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${passedTests}/${tests.length} 通过`);

  if (passedTests === tests.length) {
    console.log('✨ 所有 API 测试通过！');
  } else {
    console.log(`⚠️  有 ${tests.length - passedTests} 个测试失败`);
    console.log('\n失败的测试:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error || '未知错误'}`);
      });
  }

  // 响应时间统计
  const successfulResults = results.filter((r) => r.passed && r.responseTime);
  if (successfulResults.length > 0) {
    const avgTime =
      successfulResults.reduce(
        (sum, r) => sum + Number.parseFloat(r.responseTime!),
        0
      ) / successfulResults.length;

    console.log(`\n⏱️  平均响应时间: ${avgTime.toFixed(2)}ms`);
  }

  console.log('\n💡 提示:');
  console.log('1. 确保服务器运行在 http://localhost:3005');
  console.log('2. 检查 .env.local 中的 API keys 配置');
  console.log('3. 运行 pnpm generate-embeddings 生成向量');
  console.log('4. 运行 pnpm update-hot-keywords 更新热词');
}

// 运行测试
testSearchAPIs().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
