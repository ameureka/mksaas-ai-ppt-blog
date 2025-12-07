import { getHotKeywords } from '@/actions/hot-keywords';

export async function GET() {
  const keywords = await getHotKeywords();
  return Response.json({ success: true, data: keywords });
}
