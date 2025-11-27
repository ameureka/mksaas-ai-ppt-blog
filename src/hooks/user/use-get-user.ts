/**
 * 单个用户查询 Hook
 *
 * @description 根据 ID 获取单个用户详情
 * @example
 * const { data, isLoading, error } = useGetUser("user_1")
 */
'use client';

import { getUserById } from '@/actions/user/user';
import { userKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useGetUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const result = await getUserById(id);
      if (!result.success) {
        throw new Error(result.error || '获取用户详情失败');
      }
      return result.data;
    },
    enabled: !!id,
  });
}
