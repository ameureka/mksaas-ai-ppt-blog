'use client';

import { banUser, unbanUser } from '@/actions/user/user';
import { useToast } from '@/hooks/use-toast';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';

interface UseBanUserOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseBanUserReturn {
  banUserMutation: (id: string) => Promise<ServerActionResult<void>>;
  unbanUserMutation: (id: string) => Promise<ServerActionResult<void>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useBanUser(options?: UseBanUserOptions): UseBanUserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const banUserMutation = useCallback(
    async (id: string): Promise<ServerActionResult<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await banUser(id);

        if (result.success) {
          toast({
            title: '封禁成功',
            description: '用户已被封禁',
          });
          options?.onSuccess?.();
        } else {
          const errorMsg = result.error ?? '封禁失败';
          setError(errorMsg);
          toast({
            title: '封禁失败',
            description: errorMsg,
            variant: 'destructive',
          });
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '封禁失败';
        setError(errorMsg);
        toast({
          title: '封禁失败',
          description: errorMsg,
          variant: 'destructive',
        });
        options?.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, options]
  );

  const unbanUserMutation = useCallback(
    async (id: string): Promise<ServerActionResult<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await unbanUser(id);

        if (result.success) {
          toast({
            title: '解封成功',
            description: '用户已解除封禁',
          });
          options?.onSuccess?.();
        } else {
          const errorMsg = result.error ?? '解封失败';
          setError(errorMsg);
          toast({
            title: '解封失败',
            description: errorMsg,
            variant: 'destructive',
          });
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '解封失败';
        setError(errorMsg);
        toast({
          title: '解封失败',
          description: errorMsg,
          variant: 'destructive',
        });
        options?.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [toast, options]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    banUserMutation,
    unbanUserMutation,
    isLoading,
    error,
    reset,
  };
}
