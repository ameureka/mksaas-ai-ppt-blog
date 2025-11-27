'use client';

import { adjustCredits } from '@/actions/user/user';
import { useToast } from '@/hooks/use-toast';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';

interface UseAdjustCreditsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseAdjustCreditsReturn {
  adjustCreditsMutation: (
    userId: string,
    amount: number,
    reason: string
  ) => Promise<ServerActionResult<void>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useAdjustCredits(
  options?: UseAdjustCreditsOptions
): UseAdjustCreditsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const adjustCreditsMutation = useCallback(
    async (
      userId: string,
      amount: number,
      reason: string
    ): Promise<ServerActionResult<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await adjustCredits(userId, amount, reason);

        if (result.success) {
          toast({
            title: '积分调整成功',
            description: `已${amount > 0 ? '增加' : '扣除'} ${Math.abs(amount)} 积分`,
          });
          options?.onSuccess?.();
        } else {
          const errorMsg = result.error ?? '积分调整失败';
          setError(errorMsg);
          toast({
            title: '积分调整失败',
            description: errorMsg,
            variant: 'destructive',
          });
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '积分调整失败';
        setError(errorMsg);
        toast({
          title: '积分调整失败',
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
    adjustCreditsMutation,
    isLoading,
    error,
    reset,
  };
}
