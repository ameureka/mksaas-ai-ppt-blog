/**
 * 用户列表查询 Hook
 *
 * @description 封装 getUsers action，提供分页、搜索、状态过滤功能
 * @example
 * const { data, isLoading, error } = useGetUsers({ page: 1, pageSize: 10 })
 */
'use client';

import { getUsers } from '@/actions/user/user';
import { userKeys } from '@/lib/query-keys';
import type { UserListParams } from '@/lib/types/ppt/user';
import { useQuery } from '@tanstack/react-query';

export function useGetUsers(params?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const result = await getUsers(params);
      if (!result.success) {
        throw new Error(result.error || '获取用户列表失败');
      }
      return result.data;
    },
  });
}
