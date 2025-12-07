import { updateHotKeywords } from '@/../scripts/update-hot-keywords';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // 验证 Vercel Cron 请求
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await updateHotKeywords();
    return Response.json({ success: true });
  } catch (error) {
    console.error('[Cron] Update hot keywords failed:', error);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}
