import { getPPTs } from '@/actions/ppt/ppt';
import { hybridSearch } from '@/actions/ppt/search';
import { PPT_CATEGORY_VALUES } from '@/lib/constants/ppt';
import type { PPTCategory, PPTStatus } from '@/lib/types/ppt/ppt';
import type { NextRequest } from 'next/server';

const VALID_STATUSES: PPTStatus[] = ['draft', 'published', 'archived'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get('category');
  const statusParam = searchParams.get('status');
  const searchQuery = searchParams.get('search');

  // 如果有搜索查询且没有其他过滤条件，使用向量混合搜索
  if (searchQuery?.trim() && !categoryParam && !statusParam) {
    const startedAt = Date.now();
    try {
      const pageSize = searchParams.get('pageSize')
        ? Number(searchParams.get('pageSize'))
        : 20;

      const { results, searchType } = await hybridSearch(
        searchQuery.trim(),
        pageSize
      );

      const durationMs = Date.now() - startedAt;

      return Response.json(
        {
          success: true,
          data: {
            items: results,
            total: results.length,
            page: 1,
            pageSize,
          },
          searchType, // 返回搜索类型用于调试
          meta: {
            searchType,
            durationMs,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('[API] Hybrid search failed, falling back to SQL:', error);
      // 向量搜索失败时，降级到原有的 getPPTs
    }
  }

  // 使用原有的 getPPTs 处理其他情况（分类、状态过滤、排序等）
  const params = {
    search: searchQuery ?? undefined,
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
