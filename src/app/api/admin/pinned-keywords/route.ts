import { randomUUID } from 'crypto';

import { getDb } from '@/db';
import { pinnedKeywords } from '@/db/schema';
import { auth } from '@/lib/auth';
import { asc, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

const ALLOWED_ROLES = new Set(['admin', 'super_admin']);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return null;
  }
  return session.user;
}

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return Response.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const db = await getDb();
  const rows = await db
    .select({
      id: pinnedKeywords.id,
      keyword: pinnedKeywords.keyword,
      rank: pinnedKeywords.rank,
      createdAt: pinnedKeywords.createdAt,
      updatedAt: pinnedKeywords.updatedAt,
    })
    .from(pinnedKeywords)
    .orderBy(asc(pinnedKeywords.rank));

  return Response.json({ success: true, data: rows });
}

export async function POST(request: NextRequest) {
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
  const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

  if (!keyword) {
    return Response.json(
      { success: false, error: 'Keyword is required' },
      { status: 400 }
    );
  }

  const db = await getDb();

  const existing = await db
    .select({ id: pinnedKeywords.id })
    .from(pinnedKeywords)
    .where(eq(pinnedKeywords.keyword, keyword))
    .limit(1);

  if (existing.length > 0) {
    return Response.json(
      { success: false, error: 'Keyword already exists' },
      { status: 409 }
    );
  }

  const last = await db
    .select({ rank: pinnedKeywords.rank })
    .from(pinnedKeywords)
    .orderBy(desc(pinnedKeywords.rank))
    .limit(1);
  const nextRank = (last[0]?.rank ?? 0) + 1;
  const now = new Date();

  const [created] = await db
    .insert(pinnedKeywords)
    .values({
      id: `pkw_${randomUUID()}`,
      keyword,
      rank: nextRank,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: pinnedKeywords.id,
      keyword: pinnedKeywords.keyword,
      rank: pinnedKeywords.rank,
      createdAt: pinnedKeywords.createdAt,
      updatedAt: pinnedKeywords.updatedAt,
    });

  return Response.json({ success: true, data: created });
}
