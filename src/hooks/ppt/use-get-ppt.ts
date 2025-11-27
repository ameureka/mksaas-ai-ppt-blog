/**
 * 单个 PPT 查询 Hook
 *
 * @description 根据 ID 获取单个 PPT 详情
 * @example
 * const { data, isLoading, error } = useGetPPT("ppt_1")
 */
'use client';

import { getPPTById } from '@/actions/ppt';
import { pptKeys } from '@/lib/ppt/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useGetPPT(id: string) {
  return useQuery({
    queryKey: pptKeys.detail(id),
    queryFn: async () => {
      const result = await getPPTById(id);
      if (!result.success) {
        throw new Error(result.error || '获取PPT详情失败');
      }
      return result.data;
    },
    enabled: !!id,
  });
}
