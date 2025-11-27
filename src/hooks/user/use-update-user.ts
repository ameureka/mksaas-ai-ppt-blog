'use client';

import { updateUser } from '@/actions/user/user';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import type { PPTUser, UpdateUserInput } from '@/lib/types/ppt/user';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseUpdateUserOptions {
  onSuccess?: (data: PPTUser) => void;
  onError?: (error: string) => void;
}

interface UseUpdateUserReturn {
  updateUserMutation: (
    id: string,
    data: UpdateUserInput
  ) => Promise<ServerActionResult<PPTUser>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpdateUser(
  options?: UseUpdateUserOptions
): UseUpdateUserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUserMutation = useCallback(
    async (
      id: string,
      data: UpdateUserInput
    ): Promise<ServerActionResult<PPTUser>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await updateUser(id, data);

        if (result.success && result.data) {
          toast.success('用户信息已更新');
          options?.onSuccess?.(result.data);
        } else if (!result.success) {
          const errorMsg = result.error ?? '更新失败';
          setError(errorMsg);
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '更新失败';
        setError(errorMsg);
        toast.error(errorMsg);
        options?.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateUserMutation,
    isLoading,
    error,
    reset,
  };
}
