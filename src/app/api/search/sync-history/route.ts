import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { searchLog } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { keywords } = await request.json();

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return Response.json({ error: 'Invalid keywords' }, { status: 400 });
  }

  const db = await getDb();

  await db.insert(searchLog).values(
    keywords.map((keyword) => ({
      id: `sl_${randomUUID()}`,
      userId: session.user.id,
      keyword,
      source: 'history_sync',
      createdAt: new Date(),
    }))
  );

  return Response.json({ success: true });
}
