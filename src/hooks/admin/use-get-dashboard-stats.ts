/**
 * Dashboard 统计数据查询 Hook
 *
 * @description 获取管理后台统计数据
 * @example
 * const { data, isLoading, error } = useGetDashboardStats()
 */
'use client';

import { getDashboardStats } from '@/actions/admin/stats';
import { dashboardKeys } from '@/lib/ppt/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useGetDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success) {
        throw new Error(result.error || '获取统计数据失败');
      }
      return result.data;
    },
  });
}
