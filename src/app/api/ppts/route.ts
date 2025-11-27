import { getPPTs } from '@/actions/ppt/ppt';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = {
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? undefined,
    page: searchParams.get('page')
      ? Number(searchParams.get('page'))
      : undefined,
    pageSize: searchParams.get('pageSize')
      ? Number(searchParams.get('pageSize'))
      : undefined,
  };

  const result = await getPPTs(params);
  const status = result.success ? 200 : 400;
  return Response.json(result, { status });
}
