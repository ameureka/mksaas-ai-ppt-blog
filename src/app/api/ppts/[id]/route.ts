import { getPPTById } from '@/actions/ppt/ppt';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const result = await getPPTById(params.id);
  const status = result.success ? 200 : result.code === 'NOT_FOUND' ? 404 : 400;
  return NextResponse.json(result, { status });
}
