'use client';

import { deletePPT } from '@/actions/ppt';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseDeletePPTOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseDeletePPTReturn {
  deletePPTMutation: (id: string) => Promise<ServerActionResult<void>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useDeletePPT(
  options?: UseDeletePPTOptions
): UseDeletePPTReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePPTMutation = useCallback(
    async (id: string): Promise<ServerActionResult<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deletePPT(id);

        if (result.success) {
          toast.success('PPT 已成功删除');
          options?.onSuccess?.();
        } else {
          const errorMsg = result.error ?? '删除失败';
          setError(errorMsg);
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '删除失败';
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
    deletePPTMutation,
    isLoading,
    error,
    reset,
  };
}
