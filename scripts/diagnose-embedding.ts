#!/usr/bin/env node
/**
 * 诊断 embedding API 403 错误
 */

const SILICONFLOW_API_KEY =
  process.env.SILICONFLOW_API_KEY ||
  'sk-slbdjnzyadnecpystbwtnzhgwexekhqcygifgtrslqakntux';
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1';

// 测试不同的模型
const MODELS_TO_TEST = [
  'BAAI/bge-m3',
  'BAAI/bge-large-zh-v1.5',
  'BAAI/bge-large-en-v1.5',
  'BAAI/bge-reranker-v2-m3',
  'BAAI/bge-small-zh-v1.5',
  'BAAI/bge-base-zh-v1.5',
  'bge-m3', // 可能的简短名称
  'bge-large-zh-v1.5', // 不带 BAAI 前缀
];

async function checkAPIStatus() {
  console.log('🔍 检查 API 状态和配额...\n');
  console.log('使用的 API Key:', SILICONFLOW_API_KEY.substring(0, 10) + '...');

  // 1. 检查账户状态
  console.log('\n1️⃣ 检查账户信息...');
  try {
    const response = await fetch(`${SILICONFLOW_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API 连接成功');
      console.log('可用模型数量:', data.data?.length || 0);

      // 找出 embedding 模型
      const embeddingModels =
        data.data?.filter(
          (m: any) =>
            m.id.toLowerCase().includes('bge') ||
            m.id.toLowerCase().includes('embed')
        ) || [];

      if (embeddingModels.length > 0) {
        console.log('\n📋 可用的 Embedding 模型:');
        embeddingModels.forEach((model: any) => {
          console.log(`  - ${model.id}`);
        });
      }
    } else {
      console.log(`❌ API 状态码: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }
  } catch (error: any) {
    console.log('❌ 请求失败:', error.message);
  }
}

async function testModel(model: string) {
  const testText = '测试文本 Test text';

  try {
    const response = await fetch(`${SILICONFLOW_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: testText,
        encoding_format: 'float',
      }),
    });

    const responseText = await response.text();

    if (response.ok) {
      const data = JSON.parse(responseText);
      const embedding = data.data?.[0]?.embedding;
      if (embedding) {
        console.log(`✅ ${model} - 成功 (维度: ${embedding.length})`);
        return true;
      } else {
        console.log(`⚠️ ${model} - 返回空数据`);
      }
    } else {
      if (response.status === 403) {
        console.log(`❌ ${model} - 403 权限拒绝 (可能需要付费或不可用)`);
      } else if (response.status === 404) {
        console.log(`❌ ${model} - 404 模型不存在`);
      } else if (response.status === 401) {
        console.log(`❌ ${model} - 401 认证失败`);
      } else {
        console.log(`❌ ${model} - ${response.status} ${response.statusText}`);
      }

      // 尝试解析错误详情
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          console.log(`   错误: ${errorData.error.message}`);
        }
      } catch {
        // 忽略解析错误
      }
    }
  } catch (error: any) {
    console.log(`❌ ${model} - 请求失败: ${error.message}`);
  }

  return false;
}

async function main() {
  console.log('🧪 硅基流动 Embedding API 诊断工具\n');
  console.log('='.repeat(50));

  // 检查 API 状态
  await checkAPIStatus();

  // 测试各个模型
  console.log('\n2️⃣ 测试各个 Embedding 模型...\n');

  let successCount = 0;
  const workingModels: string[] = [];

  for (const model of MODELS_TO_TEST) {
    const success = await testModel(model);
    if (success) {
      successCount++;
      workingModels.push(model);
    }
    // 短暂延迟避免频率限制
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 诊断结果:');
  console.log(`测试模型数: ${MODELS_TO_TEST.length}`);
  console.log(`成功模型数: ${successCount}`);

  if (workingModels.length > 0) {
    console.log('\n✅ 可用的模型:');
    workingModels.forEach((model) => {
      console.log(`  - ${model}`);
    });

    console.log('\n💡 建议:');
    console.log(`1. 使用模型: ${workingModels[0]}`);
    console.log('2. 更新 src/lib/embedding.ts 中的 EMBEDDING_MODEL');
    console.log('3. 重新运行 pnpm generate-embeddings');
  } else {
    console.log('\n❌ 没有找到可用的模型');
    console.log('\n💡 可能的解决方案:');
    console.log('1. 检查 API key 是否正确');
    console.log('2. 检查账户是否有足够的额度');
    console.log('3. 访问 https://siliconflow.cn/account 查看账户状态');
    console.log('4. 考虑使用其他提供商（如 OpenAI）');
  }
}

// 运行诊断
main().catch((error) => {
  console.error('诊断失败:', error);
  process.exit(1);
});
