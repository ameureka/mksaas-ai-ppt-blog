import { getPPTs } from '@/actions/ppt/ppt';
import { PPT_CATEGORY_VALUES } from '@/lib/constants/ppt';
import type { PPTCategory, PPTStatus } from '@/lib/types/ppt/ppt';
import type { NextRequest } from 'next/server';

const VALID_STATUSES: PPTStatus[] = ['draft', 'published', 'archived'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get('category');
  const statusParam = searchParams.get('status');
  const params = {
    search: searchParams.get('search') ?? undefined,
    category:
      categoryParam &&
      PPT_CATEGORY_VALUES.includes(categoryParam as PPTCategory)
        ? (categoryParam as PPTCategory)
        : undefined,
    status:
      statusParam && VALID_STATUSES.includes(statusParam as PPTStatus)
        ? (statusParam as PPTStatus)
        : undefined,
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
