import { getDb } from '@/db';
import { pinnedKeywords } from '@/db/schema';
import { auth } from '@/lib/auth';
import { asc, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

const ALLOWED_ROLES = new Set(['admin', 'super_admin']);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return null;
  }
  return session.user;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return Response.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid body' },
      { status: 400 }
    );
  }

  const rawKeyword = (body as { keyword?: unknown }).keyword;
  const rawRank = (body as { rank?: unknown }).rank;

  const hasKeyword = typeof rawKeyword === 'string';
  const hasRank = rawRank !== undefined;

  if (!hasKeyword && !hasRank) {
    return Response.json(
      { success: false, error: 'Nothing to update' },
      { status: 400 }
    );
  }

  const newKeyword = hasKeyword ? (rawKeyword as string).trim() : undefined;
  if (hasKeyword && !newKeyword) {
    return Response.json(
      { success: false, error: 'Keyword is required' },
      { status: 400 }
    );
  }

  const newRank =
    hasRank && typeof rawRank === 'number'
      ? Math.trunc(rawRank)
      : hasRank && typeof rawRank === 'string'
        ? Math.trunc(Number(rawRank))
        : undefined;

  if (hasRank && (!newRank || newRank < 1)) {
    return Response.json(
      { success: false, error: 'Rank must be a positive integer' },
      { status: 400 }
    );
  }

  const db = await getDb();
  const all = await db
    .select({
      id: pinnedKeywords.id,
      keyword: pinnedKeywords.keyword,
      rank: pinnedKeywords.rank,
    })
    .from(pinnedKeywords)
    .orderBy(asc(pinnedKeywords.rank));

  const currentIndex = all.findIndex((item) => item.id === id);
  if (currentIndex === -1) {
    return Response.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  if (newKeyword) {
    const duplicate = all.find(
      (item) =>
        item.keyword.toLowerCase() === newKeyword.toLowerCase() &&
        item.id !== id
    );
    if (duplicate) {
      return Response.json(
        { success: false, error: 'Keyword already exists' },
        { status: 409 }
      );
    }
  }

  const now = new Date();

  // keyword-only update
  if (!hasRank) {
    const [updated] = await db
      .update(pinnedKeywords)
      .set({
        keyword: newKeyword,
        updatedAt: now,
      })
      .where(eq(pinnedKeywords.id, id))
      .returning({
        id: pinnedKeywords.id,
        keyword: pinnedKeywords.keyword,
        rank: pinnedKeywords.rank,
        updatedAt: pinnedKeywords.updatedAt,
      });

    return Response.json({ success: true, data: updated });
  }

  // reorder + optional rename
  const desiredIndex = Math.min(
    all.length - 1,
    Math.max(0, (newRank as number) - 1)
  );
  const reordered = [...all];
  const [target] = reordered.splice(currentIndex, 1);
  reordered.splice(desiredIndex, 0, {
    ...target,
    keyword: newKeyword ?? target.keyword,
  });

  try {
    await db.transaction(async (tx) => {
      // Free rank conflicts by offsetting
      await tx.update(pinnedKeywords).set({
        rank: sql`${pinnedKeywords.rank} + 1000`,
      });

      for (let i = 0; i < reordered.length; i += 1) {
        const item = reordered[i];
        const updates: Partial<typeof pinnedKeywords.$inferInsert> = {
          rank: i + 1,
          updatedAt: now,
        };
        if (item.id === id && newKeyword) {
          updates.keyword = newKeyword;
        }

        await tx
          .update(pinnedKeywords)
          .set(updates)
          .where(eq(pinnedKeywords.id, item.id));
      }
    });
  } catch (error) {
    console.error('[PinnedKeywords] Failed to reorder:', error);
    return Response.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    );
  }

  const responseData = reordered.map((item, index) => ({
    ...item,
    rank: index + 1,
    updatedAt: now.toISOString(),
  }));

  return Response.json({ success: true, data: responseData });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return Response.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const db = await getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(pinnedKeywords)
        .where(eq(pinnedKeywords.id, id))
        .returning({ id: pinnedKeywords.id });

      if (!deleted.length) {
        throw new Error('NOT_FOUND');
      }

      const remaining = await tx
        .select({
          id: pinnedKeywords.id,
          keyword: pinnedKeywords.keyword,
        })
        .from(pinnedKeywords)
        .orderBy(asc(pinnedKeywords.rank));

      await tx.update(pinnedKeywords).set({
        rank: sql`${pinnedKeywords.rank} + 1000`,
      });

      for (let i = 0; i < remaining.length; i += 1) {
        const item = remaining[i];
        await tx
          .update(pinnedKeywords)
          .set({ rank: i + 1, updatedAt: now })
          .where(eq(pinnedKeywords.id, item.id));
      }
    });
  } catch (error) {
    if ((error as Error).message === 'NOT_FOUND') {
      return Response.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }
    console.error('[PinnedKeywords] Failed to delete:', error);
    return Response.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
