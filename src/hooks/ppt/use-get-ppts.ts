/**
 * PPT 列表查询 Hook
 *
 * @description 封装 getPPTs action，提供分页、搜索、排序功能
 * @example
 * const { data, isLoading, error } = useGetPPTs({ page: 1, pageSize: 10 })
 */
'use client';

import { getPPTs } from '@/actions/ppt';
import { pptKeys } from '@/lib/ppt/query-keys';
import type { PPTListParams } from '@/lib/types/ppt/ppt';
import { useQuery } from '@tanstack/react-query';

export function useGetPPTs(params?: PPTListParams) {
  return useQuery({
    queryKey: pptKeys.list(params),
    queryFn: async () => {
      const result = await getPPTs(params);
      if (!result.success) {
        throw new Error(result.error || '获取PPT列表失败');
      }
      return result.data;
    },
  });
}
