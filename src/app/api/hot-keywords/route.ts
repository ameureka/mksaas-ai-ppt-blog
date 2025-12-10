import { getHotKeywords } from '@/actions/hot-keywords';

export async function GET() {
  const keywords = await getHotKeywords();
  const data = Array.isArray(keywords) ? keywords.slice(0, 8) : [];
  return Response.json({ success: true, data });
}
