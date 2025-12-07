import { logSearchClick } from '@/actions/search/log';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchLogId, pptId } = await request.json();

  if (!searchLogId || !pptId) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 });
  }

  await logSearchClick(searchLogId, pptId);
  return Response.json({ success: true });
}
