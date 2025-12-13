import { getDb } from '@/db';
import { ppt as pptTable } from '@/db/schema';
import { generateEmbedding, generateEmbeddingInput } from '@/lib/embedding';
import { eq, sql } from 'drizzle-orm';

const EMBEDDING_DIMENSION = 1024;
const DEFAULT_EMBEDDING_MODEL = 'BAAI/bge-m3';

export function isValidEmbedding(vec: number[]): boolean {
  return (
    Array.isArray(vec) &&
    vec.length === EMBEDDING_DIMENSION &&
    vec.every((v) => Number.isFinite(v))
  );
}

export async function generateAndPersist(
  pptId: string,
  payload: {
    title: string;
    description?: string | null;
    tags?: string[] | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const inputText = generateEmbeddingInput(payload);
    if (!inputText) {
      const error = 'empty embedding input';
      await markEmbeddingFailed(pptId, error);
      return { ok: false, error };
    }

    const embedding = await generateEmbedding(inputText);
    if (!embedding || !isValidEmbedding(embedding)) {
      const error = embedding ? 'invalid embedding generated' : 'no embedding generated';
      await markEmbeddingFailed(pptId, error);
      return { ok: false, error };
    }

    const db = await getDb();
    const now = new Date();

    await db.execute(sql`
      UPDATE ppt
      SET embedding = ${`[${embedding.join(',')}]`}::vector,
          embedding_model = ${DEFAULT_EMBEDDING_MODEL},
          embedding_status = 'success',
          embedding_error = NULL,
          embedding_updated_at = ${now},
          updated_at = ${now}
      WHERE id = ${pptId}
    `);

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'embedding generation failed';
    await markEmbeddingFailed(pptId, message);
    return { ok: false, error: message };
  }
}

async function markEmbeddingFailed(pptId: string, error: string) {
  try {
    const db = await getDb();
    const now = new Date();
    await db
      .update(pptTable)
      .set({
        embeddingStatus: 'failed',
        embeddingError: error,
        embeddingUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(pptTable.id, pptId));
  } catch (innerError) {
    console.error('[EmbeddingService] Failed to record embedding failure', innerError);
  }
}

