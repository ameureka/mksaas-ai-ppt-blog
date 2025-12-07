/**
 * Embedding 服务 - 使用硅基流动或 OpenRouter API
 */

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/embeddings';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
// 使用 bge-m3 模型（免费，支持多语言，效果更好）
const EMBEDDING_MODEL = 'BAAI/bge-m3';

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * 生成文本的 Embedding 向量
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  // 优先使用硅基流动，然后是 OpenRouter
  // 注意：如果 OPENROUTER_API_KEY 实际上是硅基流动的 key，我们也使用硅基流动 API
  const siliconflowKey = process.env.SILICONFLOW_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!siliconflowKey && !openrouterKey) {
    console.error('[Embedding] No API key configured');
    return null;
  }

  if (!text?.trim()) return null;

  // 如果 OpenRouter key 看起来像硅基流动的格式（包含 'sl'），使用硅基流动 API
  const isSiliconFlowKey = openrouterKey?.includes('sl') || siliconflowKey;
  const apiUrl = isSiliconFlowKey ? SILICONFLOW_API_URL : OPENROUTER_API_URL;
  const apiKey = siliconflowKey || openrouterKey;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.trim(),
        encoding_format: 'float',
        // 注意: dimensions 参数只有 Qwen 系列支持，BAAI 系列不需要
      }),
    });

    if (!response.ok) {
      console.error('[Embedding] API error:', response.status);
      return null;
    }

    const data: EmbeddingResponse = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error('[Embedding] Request failed:', error);
    return null;
  }
}

/**
 * 生成 PPT 的 Embedding 输入文本
 */
export function generateEmbeddingInput(ppt: {
  title: string;
  description?: string | null;
  tags?: string[] | null;
}): string {
  return [ppt.title, ppt.description || '', (ppt.tags || []).join(' ')]
    .filter(Boolean)
    .join(' ')
    .trim();
}
