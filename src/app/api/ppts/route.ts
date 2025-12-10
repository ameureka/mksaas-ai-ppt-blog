import { getPPTs } from '@/actions/ppt/ppt';
import { hybridSearch, recordSearchLog } from '@/actions/ppt/search';
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
    const keyword = searchQuery.trim();
    try {
      const pageSize = searchParams.get('pageSize')
        ? Number(searchParams.get('pageSize'))
        : 20;

      const { results, searchType } = await hybridSearch(keyword, pageSize);

      const durationMs = Date.now() - startedAt;
      await recordSearchLog({
        keyword,
        resultCount: results.length,
        searchType,
        durationMs,
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
        source: 'home_search',
      });

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
      const durationMs = Date.now() - startedAt;
      await recordSearchLog({
        keyword,
        resultCount: 0,
        searchType: 'sql',
        durationMs,
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
        source: 'home_search_error',
      });
      return Response.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Search request failed',
        },
        { status: 500 }
      );
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
