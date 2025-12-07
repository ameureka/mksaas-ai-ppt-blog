/**
 * 批量生成 PPT Embedding 脚本
 * 运行: pnpm generate-embeddings
 */
import { getDb } from '@/db';
import { ppt as pptTable } from '@/db/schema';
import { generateEmbedding, generateEmbeddingInput } from '@/lib/embedding';
import { eq, isNull, sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();

  // 获取所有未生成 embedding 的 PPT
  const ppts = await db
    .select({
      id: pptTable.id,
      title: pptTable.title,
      description: pptTable.description,
      tags: pptTable.tags,
    })
    .from(pptTable)
    .where(sql`${pptTable.embedding} IS NULL`);

  console.log(`[Embeddings] Found ${ppts.length} PPTs without embedding`);

  let success = 0;
  let failed = 0;

  for (const ppt of ppts) {
    const inputText = generateEmbeddingInput(ppt);
    const embedding = await generateEmbedding(inputText);

    if (embedding) {
      await db.execute(sql`
        UPDATE ppt 
        SET embedding = ${`[${embedding.join(',')}]`}::vector,
            embedding_model = 'BAAI/bge-m3',
            updated_at = NOW()
        WHERE id = ${ppt.id}
      `);
      success++;
      console.log(`[Embeddings] ✓ ${ppt.id}: ${ppt.title.slice(0, 30)}...`);
    } else {
      failed++;
      console.log(`[Embeddings] ✗ ${ppt.id}: ${ppt.title.slice(0, 30)}...`);
    }

    // 避免 API 限流 (增加延迟到 1 秒)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`[Embeddings] Done: ${success} success, ${failed} failed`);
}

main().catch(console.error);
