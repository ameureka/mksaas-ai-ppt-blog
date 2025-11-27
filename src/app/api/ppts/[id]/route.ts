import { getPPTById } from '@/actions/ppt/ppt';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getPPTById(id);
  const status = result.success ? 200 : result.code === 'NOT_FOUND' ? 404 : 400;
  return NextResponse.json(result, { status });
}
